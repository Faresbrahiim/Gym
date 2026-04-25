package com.gym.payment.domain.port.in;

import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;

import java.time.LocalDate;
import java.util.UUID;

public record GetAllPaymentsQuery(
        UUID userId,
        PaymentStatus status,
        PaymentTargetType targetType,
        LocalDate from,
        LocalDate to
) {}
