package com.gym.payment.domain.port.out;

import java.math.BigDecimal;

public record PlanPricing(BigDecimal amount, String currency) {}
