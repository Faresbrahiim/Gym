package com.gym.payment.domain.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record OrderPaymentCompletedEvent(
        UUID paymentId,
        UUID orderId,
        UUID userId,
        BigDecimal amount,
        String currency,
        LocalDateTime completedAt
) {}
