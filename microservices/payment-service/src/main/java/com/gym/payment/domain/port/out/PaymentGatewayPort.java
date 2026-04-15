package com.gym.payment.domain.port.out;

import com.gym.payment.domain.model.Money;

public interface PaymentGatewayPort {
    GatewayResult createPaymentIntent(Money money, String paymentMethodToken);
}
