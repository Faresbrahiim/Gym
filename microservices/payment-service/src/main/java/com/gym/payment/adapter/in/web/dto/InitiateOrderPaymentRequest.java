package com.gym.payment.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InitiateOrderPaymentRequest(
        @NotNull UUID orderId,
        @NotBlank String paymentMethodToken
) {}
