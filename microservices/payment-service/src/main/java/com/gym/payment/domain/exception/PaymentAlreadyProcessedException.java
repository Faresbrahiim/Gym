package com.gym.payment.domain.exception;

public class PaymentAlreadyProcessedException extends RuntimeException {
    public PaymentAlreadyProcessedException(String message) {
        super(message);
    }
}
