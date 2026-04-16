package com.gym.payment.adapter.out.messaging.dto;

public record PaymentCompletedMessage(
        String paymentId,
        String subscriptionId,
        String userId,
        String amount,
        String currency,
        String completedAt
) {}
