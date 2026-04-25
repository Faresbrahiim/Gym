package com.gym.payment.domain.port.out;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderPaymentDetails(
        UUID orderId,
        BigDecimal amount,
        String currency
) {}
