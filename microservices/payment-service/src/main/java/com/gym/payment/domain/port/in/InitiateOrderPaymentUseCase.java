package com.gym.payment.domain.port.in;

public interface InitiateOrderPaymentUseCase {
    InitiatePaymentResponse execute(InitiateOrderPaymentCommand command);
}
