package com.gym.payment.domain.port.in;

import com.gym.payment.domain.model.PaymentStatus;

import java.time.LocalDate;
import java.util.UUID;

public record GetAllPaymentsQuery(
        UUID userId,
        PaymentStatus status,
        LocalDate from,
        LocalDate to
) {}
