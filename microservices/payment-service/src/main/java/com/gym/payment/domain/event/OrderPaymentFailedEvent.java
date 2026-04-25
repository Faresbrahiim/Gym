package com.gym.payment.domain.event;

import java.util.UUID;

public record OrderPaymentFailedEvent(
        UUID paymentId,
        UUID orderId,
        UUID userId,
        String failureReason
) {}
