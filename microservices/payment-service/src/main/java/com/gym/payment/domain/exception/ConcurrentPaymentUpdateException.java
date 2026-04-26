package com.gym.payment.domain.exception;

public class ConcurrentPaymentUpdateException extends RuntimeException {
    public ConcurrentPaymentUpdateException(String message, Throwable cause) {
        super(message, cause);
    }
}
