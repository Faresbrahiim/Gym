package com.gym.payment.adapter.in.web.dto;

import java.util.UUID;

public record InitiatePaymentResponse(
        UUID paymentId,
        String clientSecret
) {}
