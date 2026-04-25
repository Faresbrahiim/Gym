package com.gym.payment.adapter.out.messaging.dto;

public record OrderPaymentExpiredMessage(
        String paymentId,
        String orderId,
        String userId,
        String reason
) {}
