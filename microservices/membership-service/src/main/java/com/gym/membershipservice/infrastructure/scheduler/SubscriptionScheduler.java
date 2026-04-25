package com.gym.membershipservice.infrastructure.scheduler;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
public class SubscriptionScheduler {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryService historyService;
    private final long pendingPaymentTimeoutMinutes;

    public SubscriptionScheduler(SubscriptionRepository subscriptionRepository,
                                 SubscriptionHistoryService historyService,
                                 @org.springframework.beans.factory.annotation.Value("${membership.pending-payment-timeout-minutes:10}") long pendingPaymentTimeoutMinutes) {
        this.subscriptionRepository = subscriptionRepository;
        this.historyService = historyService;
        this.pendingPaymentTimeoutMinutes = pendingPaymentTimeoutMinutes;
    }

    // --- Expire subscriptions ---
    @Scheduled(fixedRate = 100000)
    @Transactional
    public void expireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubs = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);

        for (Subscription sub : activeSubs) {
            if (sub.getEndDate() != null && sub.getEndDate().isBefore(now)) {
                System.out.println("Expiring subscription id: " + sub.getId());
                SubscriptionStatus previous = sub.getStatus();
                sub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.saveAndFlush(sub);

                historyService.recordChange(sub, previous, SubscriptionStatus.EXPIRED, null,
                        "Subscription automatically expired");
            }
        }
    }

    @Scheduled(fixedRate = 100000)
    @Transactional
    public void reactivateFrozenSubscriptions() {
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        System.out.println("Checking frozen subscriptions at UTC: " + nowUtc);

        List<Subscription> frozenSubs = subscriptionRepository.findByStatusAndFreezeEndDateBefore(SubscriptionStatus.FROZEN, nowUtc);
        for (Subscription sub : frozenSubs) {
            System.out.println("Reactivating subscription: " + sub.getId() + " | freezeEndDate=" + sub.getFreezeEndDate());

            SubscriptionStatus previousStatus = sub.getPreviousStatusBeforeFreeze() != null
                    ? sub.getPreviousStatusBeforeFreeze()
                    : SubscriptionStatus.ACTIVE;

            sub.setStatus(previousStatus);
            sub.setFreezeStartDate(null);
            sub.setFreezeEndDate(null);
            sub.setPreviousStatusBeforeFreeze(null);

            subscriptionRepository.saveAndFlush(sub);
            historyService.recordChange(sub, SubscriptionStatus.FROZEN, previousStatus, null,
                    "Subscription automatically re-activated after freeze");

            System.out.println("Subscription reactivated: " + sub.getId());
        }

        if (frozenSubs.isEmpty()) {
            System.out.println("No frozen subscriptions to reactivate at UTC: " + nowUtc);
        }
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePendingPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pendingPaymentTimeoutMinutes);
        List<Subscription> pendingSubs = subscriptionRepository
                .findByStatusAndPendingPaymentStartedAtBefore(SubscriptionStatus.PENDING_PAYMENT, cutoff);

        for (Subscription sub : pendingSubs) {
            SubscriptionStatus previous = sub.getStatus();

            if (sub.getPendingPlan() != null) {
                String pendingPlanName = sub.getPendingPlan().getName();
                sub.setPendingPlan(null);
                sub.setStatus(SubscriptionStatus.ACTIVE);
                sub.setPendingPaymentStartedAt(null);
                subscriptionRepository.saveAndFlush(sub);
                historyService.recordChange(
                        sub,
                        previous,
                        SubscriptionStatus.ACTIVE,
                        null,
                        "Pending payment expired for plan change to " + pendingPlanName + " - current plan kept active"
                );
                continue;
            }

            sub.setStatus(SubscriptionStatus.PAYMENT_FAILED);
            sub.setPendingPaymentStartedAt(null);
            subscriptionRepository.saveAndFlush(sub);
            historyService.recordChange(
                    sub,
                    previous,
                    SubscriptionStatus.PAYMENT_FAILED,
                    null,
                    "Pending payment expired after " + pendingPaymentTimeoutMinutes + " minutes"
            );
        }
    }
}
