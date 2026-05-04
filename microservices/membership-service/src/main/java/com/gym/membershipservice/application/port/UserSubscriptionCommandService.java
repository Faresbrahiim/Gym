package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;

import java.util.UUID;

public interface UserSubscriptionCommandService {

    SubscriptionResponseDTO createSubscription(UUID userId, UUID planId);

    SubscriptionResponseDTO createFreeSubscription(UUID userId);

    SubscriptionResponseDTO cancelSubscription(UUID userId, UUID subscriptionId);

    SubscriptionResponseDTO pauseSubscription(UUID userId, UUID subscriptionId);

    SubscriptionResponseDTO resumeSubscription(UUID userId, UUID subscriptionId);

    SubscriptionResponseDTO renewSubscription(UUID userId, UUID subscriptionId);

    SubscriptionResponseDTO changePlan(UUID userId, UUID subscriptionId, UUID newPlanId);

    SubscriptionResponseDTO upgradeSubscription(UUID userId, UUID subscriptionId, UUID newPlanId);

    SubscriptionResponseDTO downgradeSubscription(UUID userId, UUID subscriptionId, UUID newPlanId);
}
