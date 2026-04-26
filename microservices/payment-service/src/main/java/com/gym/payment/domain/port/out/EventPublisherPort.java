package com.gym.payment.domain.port.out;

import com.gym.payment.domain.event.OrderPaymentCompletedEvent;
import com.gym.payment.domain.event.OrderPaymentExpiredEvent;
import com.gym.payment.domain.event.OrderPaymentFailedEvent;
import com.gym.payment.domain.event.PaymentCompletedEvent;
import com.gym.payment.domain.event.PaymentExpiredEvent;
import com.gym.payment.domain.event.PaymentFailedEvent;

public interface EventPublisherPort {
    void publish(PaymentCompletedEvent event);
    void publish(PaymentFailedEvent event);
    void publish(PaymentExpiredEvent event);
    void publish(OrderPaymentCompletedEvent event);
    void publish(OrderPaymentFailedEvent event);
    void publish(OrderPaymentExpiredEvent event);
}
