package com.gym.payment.domain.model;

import com.gym.payment.domain.exception.InvalidPaymentStateException;

import java.time.LocalDateTime;
import java.util.UUID;

public class Payment {

    private final UUID id;
    private final UUID userId;
    private final PaymentTargetType targetType;
    private final UUID subscriptionId;
    private final UUID planId;
    private final UUID orderId;
    private final Money amount;
    private PaymentStatus status;
    private String stripePaymentIntentId;
    private String failureReason;
    private final LocalDateTime createdAt;
    private LocalDateTime completedAt;

    private Payment(UUID userId, PaymentTargetType targetType, UUID subscriptionId, UUID planId, UUID orderId, Money amount) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.targetType = targetType;
        this.subscriptionId = subscriptionId;
        this.planId = planId;
        this.orderId = orderId;
        this.amount = amount;
        this.status = PaymentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public static Payment forMembership(UUID userId, UUID subscriptionId, UUID planId, Money amount) {
        return new Payment(userId, PaymentTargetType.MEMBERSHIP, subscriptionId, planId, null, amount);
    }

    public static Payment forOrder(UUID userId, UUID orderId, Money amount) {
        return new Payment(userId, PaymentTargetType.ORDER, null, null, orderId, amount);
    }

    public Payment(UUID id, UUID userId, PaymentTargetType targetType, UUID subscriptionId, UUID planId, UUID orderId, Money amount,
                   PaymentStatus status, String stripePaymentIntentId, String failureReason,
                   LocalDateTime createdAt, LocalDateTime completedAt) {
        this.id = id;
        this.userId = userId;
        this.targetType = targetType;
        this.subscriptionId = subscriptionId;
        this.planId = planId;
        this.orderId = orderId;
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
    public PaymentTargetType getTargetType() { return targetType; }
    public UUID getSubscriptionId() { return subscriptionId; }
    public UUID getPlanId() { return planId; }
    public UUID getOrderId() { return orderId; }
    public Money getAmount() { return amount; }
    public PaymentStatus getStatus() { return status; }
    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public String getFailureReason() { return failureReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
