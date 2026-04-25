package com.gym.membershipservice.application.dto.Subscription;

public record AdminSubscriptionSummaryDTO(
        long totalCount,
        long activeCount,
        long pendingCount,
        long issueCount
) {}
