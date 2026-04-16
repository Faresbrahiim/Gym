package com.gym.payment.adapter.out.messaging.dto;

public record PaymentFailedMessage(
        String paymentId,
        String subscriptionId,
        String userId,
        String failureReason
) {}
