package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.kafka.SubscriptionCreatedEvent;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.SubscriptionHistoryRecorder;
import com.gym.membershipservice.application.port.UserSubscriptionCommandService;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserSubscriptionCommandServiceImpl implements UserSubscriptionCommandService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final SubscriptionHistoryRecorder historyService;
    private final PlanService planService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SubscriptionDomainSupport subscriptionDomainSupport;

    @org.springframework.beans.factory.annotation.Value("${payment.dev-mode:false}")
    private boolean paymentDevMode;

    public UserSubscriptionCommandServiceImpl(SubscriptionRepository subscriptionRepository,
                                              PlanRepository planRepository,
                                              SubscriptionHistoryRecorder historyService,
                                              PlanService planService,
                                              KafkaTemplate<String, Object> kafkaTemplate,
                                              SubscriptionDomainSupport subscriptionDomainSupport) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.historyService = historyService;
        this.planService = planService;
        this.kafkaTemplate = kafkaTemplate;
        this.subscriptionDomainSupport = subscriptionDomainSupport;
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO createSubscription(UUID userId, UUID planId) {
        if (subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)) {
            throw new ConflictException("User already has an active subscription. Use plan change instead.");
        }

        subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.PENDING_PAYMENT)
                .ifPresent(staleSub -> {
                    staleSub.setStatus(SubscriptionStatus.CANCELLED);
                    staleSub.setEndDate(LocalDateTime.now());
                    subscriptionRepository.save(staleSub);
                    historyService.recordChange(
                            staleSub,
                            SubscriptionStatus.PENDING_PAYMENT,
                            SubscriptionStatus.CANCELLED,
                            null,
                            "Cancelled stale pending payment â€” retrying"
                    );
                });

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (plan.getStatus() == PlanStatus.INACTIVE) {
            throw new BadRequestException("Cannot subscribe to inactive plan");
        }

        subscriptionDomainSupport.validatePlanDuration(plan);

        LocalDateTime now = LocalDateTime.now();
        boolean isPaid = plan.getPrice() != null && plan.getPrice() > 0;
        boolean hasFixedDuration = plan.getDurationInDays() != null && plan.getDurationInDays() > 0;
        boolean activateImmediately = !isPaid || paymentDevMode;

        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setPlan(plan);
        sub.setStartDate(now);
        sub.setStatus(activateImmediately ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING_PAYMENT);
        sub.setPendingPaymentStartedAt(activateImmediately ? null : now);
        sub.setEndDate(hasFixedDuration ? now.plusDays(plan.getDurationInDays()) : null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, null, saved.getStatus(), null,
                activateImmediately ? "Created" : "Created â€” awaiting payment");

        kafkaTemplate.send("subscription.created", new SubscriptionCreatedEvent(
                saved.getId().toString(),
                userId.toString(),
                plan.getName()
        ));

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO createFreeSubscription(UUID userId) {
        Plan freePlan = planService.getFreePlan();
        return createSubscription(userId, freePlan.getId());
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO cancelSubscription(UUID userId, UUID subscriptionId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Already Cancelled");
        }
        if (sub.getPlan().getPrice() == null || sub.getPlan().getPrice() == 0) {
            throw new BadRequestException("Free plan cannot be cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        if (sub.getStartDate() != null && sub.getStartDate().plusDays(2).isBefore(now)) {
            throw new BadRequestException("Cannot cancel after 2 days have passed");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setEndDate(now);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.CANCELLED, null, "Cancelled");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO pauseSubscription(UUID userId, UUID subscriptionId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can be paused");
        }
        if (sub.getPlan().getPrice() == null || sub.getPlan().getPrice() == 0) {
            throw new BadRequestException("Free plan cannot be paused");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.PAUSE_REQUESTED,
                null, "Pause requested (waiting admin approval)");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO resumeSubscription(UUID userId, UUID subscriptionId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.PAUSED) {
            throw new BadRequestException("Only PAUSED subscriptions can be resumed");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Resumed");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO renewSubscription(UUID userId, UUID subscriptionId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot renew cancelled subscription");
        }

        Plan plan = sub.getPlan();
        subscriptionDomainSupport.validatePlanDuration(plan);

        SubscriptionStatus previous = sub.getStatus();
        LocalDateTime now = LocalDateTime.now();
        boolean hasFixedDuration = plan.getDurationInDays() != null && plan.getDurationInDays() > 0;

        if (!hasFixedDuration) {
            sub.setStartDate(now);
            sub.setEndDate(null);
        } else if (sub.getEndDate() != null && sub.getEndDate().isAfter(now)) {
            sub.setEndDate(sub.getEndDate().plusDays(plan.getDurationInDays()));
        } else {
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(plan.getDurationInDays()));
        }

        sub.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Renewed");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO changePlan(UUID userId, UUID subscriptionId, UUID newPlanId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        Subscription sub = subscriptionDomainSupport.findAndAutoExpire(subscriptionId);
        subscriptionDomainSupport.ensurePlanStatusAllowsChange(sub);

        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getStatus() == PlanStatus.INACTIVE) {
            throw new BadRequestException("Cannot switch to inactive plan");
        }

        subscriptionDomainSupport.ensureSelfServicePlanSwitchAllowed(sub);
        subscriptionDomainSupport.validatePlanDuration(newPlan);

        SubscriptionStatus previous = sub.getStatus();
        String oldPlanName = sub.getPlan().getName();
        LocalDateTime now = LocalDateTime.now();
        boolean hasFixedDuration = newPlan.getDurationInDays() != null && newPlan.getDurationInDays() > 0;
        boolean isPaid = newPlan.getPrice() != null && newPlan.getPrice() > 0;
        boolean activateImmediately = !isPaid || paymentDevMode;

        if (activateImmediately) {
            sub.setPlan(newPlan);
            sub.setPendingPlan(null);
            sub.setStartDate(now);
            sub.setEndDate(hasFixedDuration ? now.plusDays(newPlan.getDurationInDays()) : null);
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setPendingPaymentStartedAt(null);
        } else {
            sub.setPendingPlan(newPlan);
            sub.setStatus(SubscriptionStatus.PENDING_PAYMENT);
            sub.setPendingPaymentStartedAt(now);
        }

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, saved.getStatus(), null,
                activateImmediately
                        ? "Plan changed from " + oldPlanName + " to " + newPlan.getName()
                        : "Plan change requested from " + oldPlanName + " to " + newPlan.getName() + " - awaiting payment");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO upgradeSubscription(UUID userId, UUID subscriptionId, UUID newPlanId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        throw new BadRequestException("Self-service plan changes between paid plans are not available right now");
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO downgradeSubscription(UUID userId, UUID subscriptionId, UUID newPlanId) {
        subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subscriptionId);
        throw new BadRequestException("Self-service plan changes between paid plans are not available right now");
    }
}
