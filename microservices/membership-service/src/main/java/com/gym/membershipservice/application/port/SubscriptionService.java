package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;

import java.util.List;
import java.util.UUID;

public interface SubscriptionService extends
        UserSubscriptionQueryService,
        UserSubscriptionCommandService,
        AdminSubscriptionQueryService,
        AdminSubscriptionCommandService {

    // Transitional history methods kept here until consumers are migrated
    PagedResponseDTO<SubscriptionHistoryResponseDTO> getUserSubscriptionHistory(UUID userId, int page, int pageSize);

    // Transitional admin/user overloads kept here until command/query consumers are narrowed
    SubscriptionResponseDTO cancelSubscription(UUID subscriptionId);

    SubscriptionResponseDTO pauseSubscription(UUID subscriptionId);

    SubscriptionResponseDTO resumeSubscription(UUID subscriptionId);

    SubscriptionResponseDTO renewSubscription(UUID subscriptionId);

    SubscriptionResponseDTO changePlan(UUID subscriptionId, UUID newPlanId);

    SubscriptionResponseDTO upgradeSubscription(UUID subscriptionId, UUID newPlanId);

    SubscriptionResponseDTO downgradeSubscription(UUID subscriptionId, UUID newPlanId);

    // History
    List<SubscriptionHistoryResponseDTO> getSubscriptionHistory(UUID subscriptionId);
}
