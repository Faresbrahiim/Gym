package com.gym.payment.domain.port.in;

import java.util.UUID;

public record InitiatePaymentResponse(
        UUID paymentId,
        String clientSecret
) {}
