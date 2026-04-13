package com.gym.payment.domain.port.in;

import java.util.Optional;
import java.util.UUID;

public interface GetLatestSubscriptionPaymentUseCase {
    Optional<PaymentResponse> execute(UUID subscriptionId);
}
