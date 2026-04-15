package com.gym.payment.domain.port.in;

import java.util.List;
import java.util.UUID;

public interface GetMyPaymentHistoryUseCase {
    List<PaymentResponse> execute(UUID userId);
}
