package com.gym.membershipservice.application.dto.Subscription;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public class SubscriptionHistoryResponseDTO {

    private UUID historyId;
    private UUID subscriptionId;
    private SubscriptionStatus previousStatus;
    private SubscriptionStatus newStatus;
    private LocalDateTime changedAt;
    private UUID changedBy;
    private String note;

    public SubscriptionHistoryResponseDTO(UUID historyId, UUID subscriptionId,
                                          SubscriptionStatus previousStatus,
                                          SubscriptionStatus newStatus,
                                          LocalDateTime changedAt,
                                          UUID changedBy, String note) {
        this.historyId = historyId;
        this.subscriptionId = subscriptionId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
        this.note = note;
    }

    public UUID getHistoryId() { return historyId; }
    public UUID getSubscriptionId() { return subscriptionId; }
    public SubscriptionStatus getPreviousStatus() { return previousStatus; }
    public SubscriptionStatus getNewStatus() { return newStatus; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public UUID getChangedBy() { return changedBy; }
    public String getNote() { return note; }

}