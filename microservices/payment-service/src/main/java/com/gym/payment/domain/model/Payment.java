package com.gym.payment.domain.model;

import com.gym.payment.domain.exception.InvalidPaymentStateException;

import java.time.LocalDateTime;
import java.util.UUID;

public class Payment {

    private final UUID id;
    private final UUID userId;
    private final UUID subscriptionId;
    private final UUID planId;
    private final Money amount;
    private PaymentStatus status;
    private String stripePaymentIntentId;
    private String failureReason;
    private final LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public Payment(UUID userId, UUID subscriptionId, UUID planId, Money amount) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.subscriptionId = subscriptionId;
        this.planId = planId;
        this.amount = amount;
        this.status = PaymentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Payment(UUID id, UUID userId, UUID subscriptionId, UUID planId, Money amount,
                   PaymentStatus status, String stripePaymentIntentId, String failureReason,
                   LocalDateTime createdAt, LocalDateTime completedAt) {
        this.id = id;
        this.userId = userId;
        this.subscriptionId = subscriptionId;
        this.planId = planId;
        this.amount = amount;
        this.status = status;
        this.stripePaymentIntentId = stripePaymentIntentId;
        this.failureReason = failureReason;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public void assignStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
    }

    public void markCompleted(String stripePaymentIntentId) {
        if (this.status != PaymentStatus.PENDING) {
            throw new InvalidPaymentStateException("Cannot complete a payment with status: " + this.status);
        }
        this.status = PaymentStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.stripePaymentIntentId = stripePaymentIntentId;
    }

    public void markFailed(String failureReason) {
        if (this.status != PaymentStatus.PENDING) {
            throw new InvalidPaymentStateException("Cannot fail a payment with status: " + this.status);
        }
        this.status = PaymentStatus.FAILED;
        this.failureReason = failureReason;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getSubscriptionId() { return subscriptionId; }
    public UUID getPlanId() { return planId; }
    public Money getAmount() { return amount; }
    public PaymentStatus getStatus() { return status; }
    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public String getFailureReason() { return failureReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
