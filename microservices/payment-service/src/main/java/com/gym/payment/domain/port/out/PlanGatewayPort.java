package com.gym.payment.domain.port.out;

import java.util.UUID;

public interface PlanGatewayPort {
    PlanPricing getPlanPricing(UUID planId);
}
