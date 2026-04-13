package com.gym.payment.domain.port.out;

public interface EventPublisherPort {
    void publish(String topic, Object event);
}
