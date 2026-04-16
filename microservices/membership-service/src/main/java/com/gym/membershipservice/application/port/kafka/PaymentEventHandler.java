package com.gym.membershipservice.application.port.kafka;

import com.gym.membershipservice.application.dto.kafka.PaymentCompletedMessage;
import com.gym.membershipservice.application.dto.kafka.PaymentFailedMessage;

public interface PaymentEventHandler {
    void handlePaymentCompleted(PaymentCompletedMessage message);
    void handlePaymentFailed(PaymentFailedMessage message);
}
