package com.gym.payment.domain.event;

import java.util.UUID;

public record PaymentFailedEvent(
        UUID paymentId,
        UUID subscriptionId,
        UUID userId,
        String failureReason
) {}
