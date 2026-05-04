package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;

import java.util.List;
import java.util.UUID;

public interface UserSubscriptionQueryService {

    List<SubscriptionResponseDTO> getUserSubscriptions(UUID userId);

    SubscriptionResponseDTO getUserSubscriptionById(UUID userId, UUID subscriptionId);
}
