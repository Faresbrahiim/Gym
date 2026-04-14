package com.gym.payment.domain.port.in;

import java.util.Optional;
import java.util.UUID;

public interface GetLatestSubscriptionPaymentUseCase {
    // renamed to avoid ambiguity with GetMyPaymentHistoryUseCase.execute(UUID)
    Optional<PaymentResponse> executeForSubscription(UUID subscriptionId);
}
