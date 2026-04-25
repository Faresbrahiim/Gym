package com.gym.payment.domain.port.out;

import java.util.UUID;

public interface SubscriptionGatewayPort {
    void ensureOwnedByUser(UUID userId, UUID subscriptionId);
}
