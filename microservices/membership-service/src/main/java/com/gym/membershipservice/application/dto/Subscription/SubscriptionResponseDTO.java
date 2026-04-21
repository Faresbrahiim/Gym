package com.gym.membershipservice.application.dto.Subscription;

import com.gym.membershipservice.application.enums.SubscriptionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public class SubscriptionResponseDTO {
    private UUID subscriptionId;
    private UUID userId;
    private String userEmail;
    private UUID planId;
    private String planName;
    private Double planPrice;
    private SubscriptionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime freezeStartDate;
    private LocalDateTime freezeEndDate;

    public SubscriptionResponseDTO(UUID subscriptionId, UUID userId, String userEmail, UUID planId, String planName,
                                   Double planPrice, SubscriptionStatus status,
                                   LocalDateTime startDate, LocalDateTime endDate,
                                   LocalDateTime freezeStartDate, LocalDateTime freezeEndDate) {
        this.subscriptionId = subscriptionId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.planId = planId;
        this.planName = planName;
        this.planPrice = planPrice;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.freezeStartDate = freezeStartDate;
        this.freezeEndDate = freezeEndDate;
    }

    public UUID getSubscriptionId() { return subscriptionId; }
    public UUID getUserId() { return userId; }
    public String getUserEmail() { return userEmail; }
    public UUID getPlanId() { return planId; }
    public String getPlanName() { return planName; }
    public Double getPlanPrice() { return planPrice; }
    public SubscriptionStatus getStatus() { return status; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public LocalDateTime getFreezeStartDate() { return freezeStartDate; }
    public LocalDateTime getFreezeEndDate() { return freezeEndDate; }
}