package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;

import java.util.List;
import java.util.UUID;

public interface SubscriptionHistoryQueryService {

    List<SubscriptionHistoryResponseDTO> getHistory(UUID subscriptionId);

    PagedResponseDTO<SubscriptionHistoryResponseDTO> getHistoryForUser(UUID userId, int page, int pageSize);
}
