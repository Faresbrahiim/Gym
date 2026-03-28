package com.gym.membershipservice.application.dto;

import com.gym.membershipservice.application.enums.SubscriptionStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public class SubscriptionDTO {

    private UUID id;
    private UUID userId;
    private SubscriptionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime freezeStartDate;
    private LocalDateTime freezeEndDate;

    // Nested plan info
    private PlanResponseDTO plan;

    public SubscriptionDTO(UUID id, UUID userId, SubscriptionStatus status,
                           LocalDateTime startDate, LocalDateTime endDate,
                           LocalDateTime freezeStartDate, LocalDateTime freezeEndDate,
                           PlanResponseDTO plan) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.freezeStartDate = freezeStartDate;
        this.freezeEndDate = freezeEndDate;
        this.plan = plan;
    }

    // getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public LocalDateTime getFreezeStartDate() { return freezeStartDate; }
    public void setFreezeStartDate(LocalDateTime freezeStartDate) { this.freezeStartDate = freezeStartDate; }

    public LocalDateTime getFreezeEndDate() { return freezeEndDate; }
    public void setFreezeEndDate(LocalDateTime freezeEndDate) { this.freezeEndDate = freezeEndDate; }

    public PlanResponseDTO getPlan() { return plan; }
    public void setPlan(PlanResponseDTO plan) { this.plan = plan; }
}