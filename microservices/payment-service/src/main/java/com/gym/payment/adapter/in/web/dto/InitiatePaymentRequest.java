package com.gym.payment.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InitiatePaymentRequest(
        @NotNull UUID subscriptionId,
        @NotNull UUID planId,
        @NotBlank String paymentMethodToken
) {}
