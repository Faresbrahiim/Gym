package com.gym.membershipservice.application.dto;

import com.gym.membershipservice.application.enums.SubscriptionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public class SubscriptionResponseDTO {
    private UUID subscriptionId;
    private UUID userId;
    private UUID planId;
    private String planName;
    private SubscriptionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime freezeStartDate;
    private LocalDateTime freezeEndDate;

    public SubscriptionResponseDTO(UUID subscriptionId, UUID userId, UUID planId, String planName,
                                   SubscriptionStatus status, LocalDateTime startDate, LocalDateTime endDate,
                                   LocalDateTime freezeStartDate, LocalDateTime freezeEndDate) {
        this.subscriptionId = subscriptionId;
        this.userId = userId;
        this.planId = planId;
        this.planName = planName;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.freezeStartDate = freezeStartDate;
        this.freezeEndDate = freezeEndDate;
    }

    public UUID getSubscriptionId() { return subscriptionId; }
    public UUID getUserId() { return userId; }
    public UUID getPlanId() { return planId; }
    public String getPlanName() { return planName; }
    public SubscriptionStatus getStatus() { return status; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public LocalDateTime getFreezeStartDate() { return freezeStartDate; }
    public LocalDateTime getFreezeEndDate() { return freezeEndDate; }
}