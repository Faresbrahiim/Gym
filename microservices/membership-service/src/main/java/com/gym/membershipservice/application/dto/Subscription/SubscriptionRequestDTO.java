package com.gym.membershipservice.application.dto.Subscription;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SubscriptionRequestDTO {

    @NotNull(message = "Plan ID is required")
    private UUID planId;

    public UUID getPlanId() { return planId; }
    public void setPlanId(UUID planId) { this.planId = planId; }
}