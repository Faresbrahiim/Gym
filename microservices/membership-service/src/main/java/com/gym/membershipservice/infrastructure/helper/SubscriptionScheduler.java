package com.gym.membershipservice.infrastructure.helper;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SubscriptionScheduler {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionScheduler(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    // runs every hour
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void expireSubscriptions() {

        List<Subscription> subs = subscriptionRepository.findAll();

        for (Subscription sub : subs) {
            if (sub.getEndDate() != null &&
                    sub.getEndDate().isBefore(LocalDateTime.now()) &&
                    sub.getStatus() == SubscriptionStatus.ACTIVE) {

                sub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(sub);
            }
        }
    }
}