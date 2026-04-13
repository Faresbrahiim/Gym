package com.gym.payment.domain.port.out;

public record GatewayResult(
        String paymentIntentId,
        String clientSecret
) {}
