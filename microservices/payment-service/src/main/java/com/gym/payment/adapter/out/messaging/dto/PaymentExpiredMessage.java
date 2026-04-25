package com.gym.payment.adapter.out.messaging.dto;

public record PaymentExpiredMessage(
        String paymentId,
        String subscriptionId,
        String userId,
        String reason
) {}
