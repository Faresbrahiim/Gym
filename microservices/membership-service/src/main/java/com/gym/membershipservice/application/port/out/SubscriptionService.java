package com.gym.membershipservice.application.port.out;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

public interface SubscriptionService {
    List<Subscription> getUserSubscriptions(UUID userId);
    Subscription getSubscriptionById(UUID subscriptionId);
    Subscription createSubscription(UUID userId, UUID planId);
    Subscription cancelSubscription(UUID subscriptionId);
    Subscription pauseSubscription(UUID subscriptionId);
    Subscription resumeSubscription(UUID subscriptionId);
    Subscription renewSubscription(UUID subscriptionId);
    public Subscription upgradeSubscription(UUID subscriptionId, UUID newPlanId) ;
    public Subscription downgradeSubscription(UUID subscriptionId, UUID newPlanId) ;
    Subscription changePlan(UUID subscriptionId, UUID newPlanId);
     List<SubscriptionHistory> getSubscriptionHistory(@PathVariable UUID subscriptionId) ;
     Subscription approvePause(UUID subscriptionId) ;
    Subscription rejectPause(UUID subscriptionId); // optional if you want admin to reject

    }