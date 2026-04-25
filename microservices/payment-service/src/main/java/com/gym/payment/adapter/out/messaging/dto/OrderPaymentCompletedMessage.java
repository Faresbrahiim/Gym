package com.gym.payment.adapter.out.messaging.dto;

public record OrderPaymentCompletedMessage(
        String paymentId,
        String orderId,
        String userId,
        String amount,
        String currency,
        String completedAt
) {}
