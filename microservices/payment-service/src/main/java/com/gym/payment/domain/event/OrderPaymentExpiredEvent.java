package com.gym.payment.domain.event;

import java.util.UUID;

public record OrderPaymentExpiredEvent(
        UUID paymentId,
        UUID orderId,
        UUID userId,
        String reason
) {}
