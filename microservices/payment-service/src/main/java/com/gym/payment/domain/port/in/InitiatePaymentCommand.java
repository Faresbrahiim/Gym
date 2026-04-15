package com.gym.payment.domain.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public record InitiatePaymentCommand(
        UUID userId,
        UUID subscriptionId,
        UUID planId,
        BigDecimal amount,
        String currency,
        String paymentMethodToken
) {}
