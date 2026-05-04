package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.AdminSubscriptionSummaryDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;

import java.util.List;
import java.util.UUID;

public interface AdminSubscriptionQueryService {

    List<SubscriptionResponseDTO> getAllSubscriptions();

    PagedResponseDTO<SubscriptionResponseDTO> getAllSubscriptions(int page, int pageSize, String statusFilter, String search);

    AdminSubscriptionSummaryDTO getAdminSubscriptionSummary();

    List<SubscriptionResponseDTO> getUserSubscriptions(UUID userId);

    SubscriptionResponseDTO getSubscriptionById(UUID subscriptionId);
}
