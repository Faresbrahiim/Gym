package com.gym.payment.adapter.in.web.dto;

import com.gym.payment.domain.model.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID userId,
        UUID subscriptionId,
        UUID planId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String stripePaymentIntentId,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime completedAt
) {}
