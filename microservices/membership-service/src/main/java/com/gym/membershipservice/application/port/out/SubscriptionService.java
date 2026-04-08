package com.gym.membershipservice.application.port.out;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubscriptionService {

    // ===== USER =====
    List<Subscription> getUserSubscriptions(UUID userId);
    Subscription getSubscriptionById(UUID subscriptionId);
    Subscription createSubscription(UUID userId, UUID planId);
    Subscription cancelSubscription(UUID subscriptionId);
    Subscription pauseSubscription(UUID subscriptionId);
    Subscription resumeSubscription(UUID subscriptionId);
    Subscription renewSubscription(UUID subscriptionId);
    Subscription upgradeSubscription(UUID subscriptionId, UUID newPlanId);
    Subscription downgradeSubscription(UUID subscriptionId, UUID newPlanId);
    Subscription changePlan(UUID subscriptionId, UUID newPlanId);


    // ===== ADMIN =====
    List<Subscription> getAllSubscriptions();
    Subscription extendSubscription(UUID subscriptionId, int extraDays);
    Subscription activateSubscription(UUID subscriptionId);
    Subscription approvePause(UUID subscriptionId);
    Subscription rejectPause(UUID subscriptionId);
    List<SubscriptionHistory> getSubscriptionHistory(UUID subscriptionId);
    Subscription freezeSubscription(UUID subscriptionId, LocalDateTime freezeEnd);
//    void checkAndActivateFrozenSubscriptions();
    public Subscription createFreeSubscription(UUID userId) ;


}