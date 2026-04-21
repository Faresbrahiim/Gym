package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubscriptionService {

    // Basic
    List<SubscriptionResponseDTO> getAllSubscriptions();
    List<SubscriptionResponseDTO> getUserSubscriptions(UUID userId);
    SubscriptionResponseDTO getSubscriptionById(UUID subscriptionId);

    // User actions
    SubscriptionResponseDTO createSubscription(UUID userId, UUID planId);
    SubscriptionResponseDTO createFreeSubscription(UUID userId);
    SubscriptionResponseDTO cancelSubscription(UUID subscriptionId);
    SubscriptionResponseDTO pauseSubscription(UUID subscriptionId);
    SubscriptionResponseDTO resumeSubscription(UUID subscriptionId);
    SubscriptionResponseDTO renewSubscription(UUID subscriptionId);
    SubscriptionResponseDTO changePlan(UUID subscriptionId, UUID newPlanId);
    SubscriptionResponseDTO upgradeSubscription(UUID subscriptionId, UUID newPlanId);
    SubscriptionResponseDTO downgradeSubscription(UUID subscriptionId, UUID newPlanId);

    // Admin actions
    SubscriptionResponseDTO activateSubscription(UUID subscriptionId);
    SubscriptionResponseDTO freezeSubscription(UUID subscriptionId, LocalDateTime freezeEnd);
    SubscriptionResponseDTO extendSubscription(UUID subscriptionId, int extraDays);
    SubscriptionResponseDTO approvePause(UUID subscriptionId);
    SubscriptionResponseDTO rejectPause(UUID subscriptionId);

    // History
    List<SubscriptionHistoryResponseDTO> getSubscriptionHistory(UUID subscriptionId);
}