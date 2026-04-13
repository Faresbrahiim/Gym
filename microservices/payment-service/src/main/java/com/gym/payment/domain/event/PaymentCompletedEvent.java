package com.gym.payment.domain.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentCompletedEvent(
        UUID paymentId,
        UUID subscriptionId,
        UUID userId,
        BigDecimal amount,
        String currency,
        LocalDateTime completedAt
) {}
