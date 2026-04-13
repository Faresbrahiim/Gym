package com.gym.payment.domain.model;

import java.math.BigDecimal;

public record Money(BigDecimal amount, String currency) {

    public Money {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (!"MAD".equals(currency)) {
            throw new IllegalArgumentException("Currency must be MAD");
        }
    }
}
