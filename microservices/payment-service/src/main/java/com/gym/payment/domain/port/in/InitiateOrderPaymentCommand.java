package com.gym.payment.domain.port.in;

import java.util.UUID;

public record InitiateOrderPaymentCommand(
        UUID userId,
        UUID orderId,
        String paymentMethodToken
) {}
