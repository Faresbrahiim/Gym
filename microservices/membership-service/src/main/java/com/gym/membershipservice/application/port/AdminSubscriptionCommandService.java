package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AdminSubscriptionCommandService {

    SubscriptionResponseDTO cancelSubscription(UUID subscriptionId);

    SubscriptionResponseDTO activateSubscription(UUID subscriptionId);

    SubscriptionResponseDTO freezeSubscription(UUID subscriptionId, LocalDateTime freezeEnd);

    SubscriptionResponseDTO extendSubscription(UUID subscriptionId, int extraDays);

    SubscriptionResponseDTO approvePause(UUID subscriptionId);

    SubscriptionResponseDTO rejectPause(UUID subscriptionId);
}
