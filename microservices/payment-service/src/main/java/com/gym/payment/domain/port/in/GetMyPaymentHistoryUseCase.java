package com.gym.payment.domain.port.in;

import com.gym.payment.domain.model.PaymentStatus;

import java.util.UUID;

public interface GetMyPaymentHistoryUseCase {
    PagedResult<PaymentResponse> execute(UUID userId, PaymentStatus status, int page, int pageSize);
}
