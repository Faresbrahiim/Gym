package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.api.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.application.port.SubscriptionService;
import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final SubscriptionHistoryService historyService;
    private final PlanService planService;

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   PlanRepository planRepository,
                                   SubscriptionHistoryService historyService,
                                   PlanServiceImpl planService) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.historyService = historyService;
        this.planService = planService;
    }

    // =========================
    // BASIC METHODS
    // =========================

    @Override
    public List<SubscriptionResponseDTO> getUserSubscriptions(UUID userId) {
        return SubscriptionMapper.toDTOList(subscriptionRepository.findByUserId(userId));
    }

    @Override
    public List<SubscriptionResponseDTO> getAllSubscriptions() {
        return SubscriptionMapper.toDTOList(subscriptionRepository.findAll());
    }

    @Override
    public SubscriptionResponseDTO getSubscriptionById(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        return SubscriptionMapper.toDTO(sub);
    }

    // internal helper — returns entity (used within this service only)
    private Subscription findAndAutoExpire(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        if (sub.getEndDate() != null &&
                sub.getEndDate().isBefore(LocalDateTime.now()) &&
                sub.getStatus() == SubscriptionStatus.ACTIVE) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
        }
        return sub;
    }

    // =========================
    // CREATE
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO createSubscription(UUID userId, UUID planId) {
        if (subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)) {
            throw new ConflictException("User already has an active subscription");
        }

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (plan.getStatus() == PlanStatus.INACTIVE) {
            throw new BadRequestException("Cannot subscribe to inactive plan");
        }

        validatePlanDuration(plan);

        LocalDateTime now = LocalDateTime.now();
        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setPlan(plan);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(now);
        sub.setEndDate(now.plusDays(plan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, null, SubscriptionStatus.ACTIVE, null, "Created");

        return SubscriptionMapper.toDTO(saved);
    }

    @Transactional
    public SubscriptionResponseDTO createFreeSubscription(UUID userId) {
        Plan freePlan = planService.getFreePlan();
        return createSubscription(userId, freePlan.getId());
    }

    // =========================
    // CANCEL
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO cancelSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Already Cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        if (sub.getStartDate() != null && sub.getStartDate().plusDays(2).isBefore(now)) {
            throw new BadRequestException("Cannot cancel before 2 days");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setEndDate(now);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.CANCELLED, null, "Cancelled");

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // PAUSE / APPROVE / REJECT
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO pauseSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can be paused");
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
    public SubscriptionResponseDTO approvePause(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new BadRequestException("No pause request to approve");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.PAUSED);
        sub.setPausedAt(LocalDateTime.now());

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.PAUSED, null, "Pause approved");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO rejectPause(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new BadRequestException("No pause request to reject");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Pause rejected");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO resumeSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
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

    // =========================
    // RENEW / CHANGE PLAN
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO renewSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot renew cancelled subscription");
        }

        Plan plan = sub.getPlan();
        validatePlanDuration(plan);

        SubscriptionStatus previous = sub.getStatus();
        LocalDateTime now = LocalDateTime.now();

        if (sub.getEndDate() != null && sub.getEndDate().isAfter(now)) {
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
    public SubscriptionResponseDTO changePlan(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can change plan");
        }

        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getStatus() == PlanStatus.INACTIVE) {
            throw new BadRequestException("Cannot switch to inactive plan");
        }

        validatePlanDuration(newPlan);

        SubscriptionStatus previous = sub.getStatus();
        String oldPlanName = sub.getPlan().getName();
        LocalDateTime now = LocalDateTime.now();

        sub.setPlan(newPlan);
        sub.setStartDate(now);
        sub.setEndDate(now.plusDays(newPlan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, previous, null,
                "Plan changed from " + oldPlanName + " to " + newPlan.getName());

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // UPGRADE / DOWNGRADE
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO upgradeSubscription(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getPrice().compareTo(sub.getPlan().getPrice()) <= 0) {
            throw new BadRequestException("New plan must be more expensive");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setPlan(newPlan);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(LocalDateTime.now().plusDays(newPlan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, previous, null, "Upgraded to " + newPlan.getName());

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO downgradeSubscription(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (newPlan.getPrice().compareTo(sub.getPlan().getPrice()) >= 0) {
            throw new BadRequestException("New plan must be cheaper");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setPlan(newPlan);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(LocalDateTime.now().plusDays(newPlan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, previous, null, "Downgraded to " + newPlan.getName());

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // ADMIN / FREEZE
    // =========================

    @Override
    @Transactional
    public SubscriptionResponseDTO extendSubscription(UUID subscriptionId, int extraDays) {
        if (extraDays <= 0) throw new BadRequestException("Extra days must be > 0");

        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot extend cancelled subscription");
        }

        SubscriptionStatus previous = sub.getStatus();
        LocalDateTime now = LocalDateTime.now();

        if (sub.getEndDate() != null && sub.getEndDate().isAfter(now)) {
            sub.setEndDate(sub.getEndDate().plusDays(extraDays));
        } else {
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(extraDays));
            sub.setStatus(SubscriptionStatus.ACTIVE);
        }

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, sub.getStatus(), null,
                "Extended by " + extraDays + " days");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO activateSubscription(UUID subscriptionId) {
        Subscription sub = findAndAutoExpire(subscriptionId);
        if (sub.getStatus() == SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Already active");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setStatus(SubscriptionStatus.ACTIVE);

        if (sub.getEndDate() == null || sub.getEndDate().isBefore(LocalDateTime.now())) {
            Plan plan = sub.getPlan();
            validatePlanDuration(plan);
            LocalDateTime now = LocalDateTime.now();
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(plan.getDurationInDays()));
        }

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null, "Activated by admin");

        return SubscriptionMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public SubscriptionResponseDTO freezeSubscription(UUID subscriptionId, LocalDateTime freezeEnd) {
        Subscription sub = findAndAutoExpire(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE subscriptions can be frozen");
        }
        if (freezeEnd.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Freeze end must be in the future");
        }

        SubscriptionStatus previous = sub.getStatus();
        sub.setPreviousStatusBeforeFreeze(previous);
        sub.setStatus(SubscriptionStatus.FROZEN);
        sub.setFreezeStartDate(LocalDateTime.now());
        sub.setFreezeEndDate(freezeEnd);

        Subscription saved = subscriptionRepository.save(sub);
        historyService.recordChange(saved, previous, SubscriptionStatus.FROZEN, null,
                "Subscription frozen until " + freezeEnd);

        return SubscriptionMapper.toDTO(saved);
    }

    // =========================
    // HISTORY
    // =========================

    @Override
    public List<SubscriptionHistoryResponseDTO> getSubscriptionHistory(UUID subscriptionId) {
        return historyService.getHistory(subscriptionId);
    }

    // =========================
    // HELPER
    // =========================

    private void validatePlanDuration(Plan plan) {
        if (plan.getDurationInDays() == null || plan.getDurationInDays() < 0) {
            throw new BadRequestException("Invalid plan duration");
        }
    }
}