package com.gym.membershipservice.infrastructure.helper;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.out.SubscriptionHistoryService;
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

    public SubscriptionScheduler(SubscriptionRepository subscriptionRepository,
                                 SubscriptionHistoryService historyService) {
        this.subscriptionRepository = subscriptionRepository;
        this.historyService = historyService;
    }

    // --- Expire subscriptions ---
    @Scheduled(fixedRate = 100000) // every 10s for testing
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
    // NOTE : when make sure u subtract one hour
    @Scheduled(fixedRate = 10000)
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
}