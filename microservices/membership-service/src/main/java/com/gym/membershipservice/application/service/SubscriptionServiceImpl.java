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

        // Auto-expire logic
        if (sub.getEndDate() != null &&
                sub.getEndDate().isBefore(LocalDateTime.now()) &&
                sub.getStatus() == SubscriptionStatus.ACTIVE) {

            sub.setStatus(SubscriptionStatus.EXPIRED);
            return subscriptionRepository.save(sub);
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

        validatePlanDuration(plan);

        LocalDateTime now = LocalDateTime.now();

        Subscription subscription = new Subscription();
        subscription.setUserId(userId);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(now);
        subscription.setEndDate(now.plusDays(plan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(subscription);

        historyService.recordChange(saved, null,
                SubscriptionStatus.ACTIVE, null, "Created");

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

        if (sub.getStartDate() != null &&
                sub.getStartDate().plusDays(2).isBefore(now)) {
            throw new RuntimeException("Cannot cancel after 2 days of start");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setEndDate(now);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous,
                SubscriptionStatus.CANCELLED, null, "Cancelled");

        return saved;
    }

    // =========================
    // PAUSE REQUEST
    // =========================

    @Transactional
    public Subscription pauseSubscription(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE subscriptions can request pause");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous,
                SubscriptionStatus.PAUSE_REQUESTED, null,
                "Pause requested (waiting admin approval)");

        return saved;
    }

    // =========================
    // APPROVE PAUSE
    // =========================

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

        historyService.recordChange(saved, previous,
                SubscriptionStatus.PAUSED, null,
                "Pause approved");

        return saved;
    }

    // =========================
    // REJECT PAUSE
    // =========================

    @Transactional
    public Subscription rejectPause(UUID subscriptionId) {
        Subscription sub = getSubscriptionById(subscriptionId);

        if (sub.getStatus() != SubscriptionStatus.PAUSE_REQUESTED) {
            throw new RuntimeException("No pause request to reject");
        }

        SubscriptionStatus previous = sub.getStatus();

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous,
                SubscriptionStatus.ACTIVE, null,
                "Pause rejected");

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

        historyService.recordChange(saved, previous,
                SubscriptionStatus.ACTIVE, null, "Resumed");

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

        historyService.recordChange(saved, previous,
                SubscriptionStatus.ACTIVE, null, "Renewed");

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

        if (newPlan.getStatus() == PlanStatus.INACTIVE) {
            throw new RuntimeException("Cannot switch to inactive plan");
        }

        validatePlanDuration(newPlan);

        SubscriptionStatus previous = sub.getStatus();

        String oldPlan = sub.getPlan().getName();
        String newPlanName = newPlan.getName();

        LocalDateTime now = LocalDateTime.now();

        sub.setPlan(newPlan);
        sub.setStartDate(now);
        sub.setEndDate(now.plusDays(newPlan.getDurationInDays()));

        Subscription saved = subscriptionRepository.save(sub);

        historyService.recordChange(saved, previous, previous, null,
                "Plan changed from " + oldPlan + " to " + newPlanName);

        return saved;
    }

    // =========================
    // HISTORY
    // =========================

    public List<SubscriptionHistory> getSubscriptionHistory(UUID subscriptionId) {
        return historyService.getHistory(subscriptionId);
    }

    // =========================
    // NOT IMPLEMENTED
    // =========================

    @Transactional
    public Subscription upgradeSubscription(UUID subscriptionId) {
        throw new UnsupportedOperationException("Upgrade logic not implemented yet");
    }

    @Transactional
    public Subscription downgradeSubscription(UUID subscriptionId) {
        throw new UnsupportedOperationException("Downgrade logic not implemented yet");
    }

    // =========================
    // HELPER
    // =========================

    private void validatePlanDuration(Plan plan) {
        if (plan.getDurationInDays() == null || plan.getDurationInDays() <= 0) {
            throw new RuntimeException("Invalid plan duration");
        }
    }
}