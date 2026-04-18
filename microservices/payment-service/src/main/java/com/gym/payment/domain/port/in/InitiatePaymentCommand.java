package com.gym.payment.domain.port.in;

import java.util.UUID;

public record InitiatePaymentCommand(
        UUID userId,
        UUID subscriptionId,
        UUID planId,
        String paymentMethodToken
) {}
