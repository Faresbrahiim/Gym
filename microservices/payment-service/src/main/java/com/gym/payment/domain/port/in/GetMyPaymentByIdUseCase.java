package com.gym.payment.domain.port.in;

import java.util.Optional;
import java.util.UUID;

public interface GetMyPaymentByIdUseCase {
    Optional<PaymentResponse> execute(UUID userId, UUID paymentId);
}
