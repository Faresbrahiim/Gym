package com.gym.payment.domain.event;

import java.util.UUID;

public record PaymentExpiredEvent(
        UUID paymentId,
        UUID subscriptionId,
        UUID userId,
        String reason
) {}
