package com.gym.membershipservice.application.service;

import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.out.SubscriptionHistoryService;
import com.gym.membershipservice.application.port.out.SubscriptionService;
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

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   PlanRepository planRepository,
                                   SubscriptionHistoryService historyService) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.historyService = historyService;
    }

    // =========================
    // BASIC METHODS
    // =========================
    public List<Subscription> getUserSubscriptions(UUID userId) {
        return subscriptionRepository.findByUserId(userId);
    }

    public Subscription getSubscriptionById(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

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

    @Transactional
    public Subscription createSubscription(UUID userId, UUID planId) {

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (plan.getStatus() == PlanStatus.INACTIVE) {
            throw new RuntimeException("Cannot subscribe to inactive plan");
        }

        Subscription subscription = new Subscription();
        subscription.setUserId(userId);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusDays(plan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(subscription);

        historyService.recordChange(saved, null, SubscriptionStatus.ACTIVE, null, "Created");

        return saved;
    }
    // =========================
    // CANCEL
    // =========================
    @Transactional
    public Subscription cancelSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new RuntimeException("Already cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        if (sub.getStartDate().plusDays(2).isBefore(now)) {
            throw new RuntimeException("Cannot cancel subscription after 1 day of start");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setEndDate(now);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous, SubscriptionStatus.CANCELLED, null, "Cancelled");

        return saved;
    }

    // =========================
    // PAUSE
    // =========================
    @Transactional
    public Subscription pauseSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE subscriptions can request a pause");
        }

        SubscriptionStatus previous = sub.getStatus();

        // Instead of pausing immediately, mark as requested
        sub.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous, SubscriptionStatus.PAUSE_REQUESTED, null, "Pause requested, waiting admin approval");

        return saved;
    }

    @Transactional
    public Subscription approvePause(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new RuntimeException("No pause request to approve");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setStatus(SubscriptionStatus.PAUSED);
        sub.setPausedAt(LocalDateTime.now());

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous, SubscriptionStatus.PAUSED, null, "Pause approved by admin");

        return saved;
    }


    // =========================
    // RESUME
    // =========================

    @Transactional
    public Subscription resumeSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.PAUSED) {
            throw new RuntimeException("Only PAUSED subscriptions can be resumed");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(sub, previous, SubscriptionStatus.ACTIVE, null, "Resumed");

        return saved;
    }

    // =========================
    // RENEW
    // =========================

    @Transactional
    public Subscription renewSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new RuntimeException("Cannot renew cancelled subscription");
        }

        SubscriptionStatus previous = sub.getStatus();

        Plan plan = sub.getPlan();

        LocalDateTime now = LocalDateTime.now();

        if (sub.getEndDate().isAfter(now)) {
            sub.setEndDate(sub.getEndDate().plusDays(plan.getDurationInDays()));
        } else {
            sub.setStartDate(now);
            sub.setEndDate(now.plusDays(plan.getDurationInDays()));
        }

        sub.setStatus(SubscriptionStatus.ACTIVE);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(sub, previous, SubscriptionStatus.ACTIVE, null, "Renewed");

        return saved;
    }

    // =========================
    // CHANGE PLAN
    // =========================

    @Transactional
    public Subscription changePlan(UUID subscriptionId, UUID newPlanId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE subscriptions can change plan");
        }

        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (newPlan.getStatus().name().equals("INACTIVE")) {
            throw new RuntimeException("Cannot switch to inactive plan");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setPlan(newPlan);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(LocalDateTime.now().plusDays(newPlan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous, previous, null, "Plan changed from X to Y");

        return saved;
    }

    @Override
    @Transactional
    public Subscription upgradeSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);
        // Implement your logic: maybe switch to higher tier plan
        throw new UnsupportedOperationException("Upgrade logic not implemented yet");
    }

    @Override
    @Transactional
    public Subscription downgradeSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);
        // Implement your logic: maybe switch to lower tier plan
        throw new UnsupportedOperationException("Downgrade logic not implemented yet");
    }

    @Override
    public List<SubscriptionHistory> getSubscriptionHistory(UUID subscriptionId) {
        // Use your historyService to fetch
        return historyService.getHistory(subscriptionId);
    }

    @Transactional
    @Override
    public Subscription rejectPause(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new RuntimeException("No pause request to reject");
        }

        SubscriptionStatus previous = sub.getStatus();

        // Revert to previous status, usually ACTIVE
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous, SubscriptionStatus.ACTIVE, null,
                "Pause request rejected by admin");

        return saved;
    }

}