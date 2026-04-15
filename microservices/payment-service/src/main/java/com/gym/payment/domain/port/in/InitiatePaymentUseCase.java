package com.gym.payment.domain.port.in;

public interface InitiatePaymentUseCase {
    InitiatePaymentResponse execute(InitiatePaymentCommand command);
}
