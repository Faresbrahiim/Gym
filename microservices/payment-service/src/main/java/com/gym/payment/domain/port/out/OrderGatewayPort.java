package com.gym.payment.domain.port.out;

import java.util.UUID;

public interface OrderGatewayPort {
    OrderPaymentDetails getOrderPaymentDetails(UUID userId, UUID orderId);
}
