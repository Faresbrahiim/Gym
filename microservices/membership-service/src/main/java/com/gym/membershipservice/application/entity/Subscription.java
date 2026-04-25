package com.gym.membershipservice.application.entity;

import com.gym.membershipservice.application.enums.SubscriptionStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name = "subscriptions", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_plan_id", columnList = "plan_id")
})
public class Subscription {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @ManyToOne
    @JoinColumn(name = "pending_plan_id")
    private Plan pendingPlan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    private LocalDateTime pendingPaymentStartedAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime pausedAt;

    // ===== NEW FIELDS FOR FREEZE =====
    private LocalDateTime freezeStartDate;
    private LocalDateTime freezeEndDate;
    @Enumerated(EnumType.STRING)
    private SubscriptionStatus previousStatusBeforeFreeze;

    // =========================
    // Getters & Setters
    // =========================
    public UUID getId() { return id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }

    public Plan getPendingPlan() { return pendingPlan; }
    public void setPendingPlan(Plan pendingPlan) { this.pendingPlan = pendingPlan; }

    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }

    public LocalDateTime getPendingPaymentStartedAt() { return pendingPaymentStartedAt; }
    public void setPendingPaymentStartedAt(LocalDateTime pendingPaymentStartedAt) { this.pendingPaymentStartedAt = pendingPaymentStartedAt; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public LocalDateTime getPausedAt() { return pausedAt; }
    public void setPausedAt(LocalDateTime pausedAt) { this.pausedAt = pausedAt; }

    // ===== Getters & Setters for freeze =====
    public LocalDateTime getFreezeStartDate() { return freezeStartDate; }
    public void setFreezeStartDate(LocalDateTime freezeStartDate) { this.freezeStartDate = freezeStartDate; }

    public LocalDateTime getFreezeEndDate() { return freezeEndDate; }
    public void setFreezeEndDate(LocalDateTime freezeEndDate) { this.freezeEndDate = freezeEndDate; }

    public SubscriptionStatus getPreviousStatusBeforeFreeze() { return previousStatusBeforeFreeze; }
    public void setPreviousStatusBeforeFreeze(SubscriptionStatus previousStatusBeforeFreeze) {
        this.previousStatusBeforeFreeze = previousStatusBeforeFreeze;
    }


    public void setId(UUID subId) {
        this.id = subId ;
    }
}
