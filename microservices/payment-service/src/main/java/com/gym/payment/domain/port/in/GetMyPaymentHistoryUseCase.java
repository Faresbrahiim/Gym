package com.gym.payment.domain.port.in;

import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;

import java.util.UUID;

public interface GetMyPaymentHistoryUseCase {
    PagedResult<PaymentResponse> execute(UUID userId, PaymentStatus status, PaymentTargetType targetType, int page, int pageSize);
}
