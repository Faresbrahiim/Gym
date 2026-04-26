package com.gym.payment.domain.port.in;

import com.gym.payment.domain.model.Payment;

public interface ExpirePendingPaymentUseCase {
    void expirePendingPayment(Payment payment, String reason);
}
