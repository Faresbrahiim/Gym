package com.gym.payment.adapter.out.messaging.dto;

public record OrderPaymentFailedMessage(
        String paymentId,
        String orderId,
        String userId,
        String failureReason
) {}
