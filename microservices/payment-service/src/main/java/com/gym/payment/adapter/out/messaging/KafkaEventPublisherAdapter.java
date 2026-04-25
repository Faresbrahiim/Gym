package com.gym.payment.adapter.out.messaging;

import com.gym.payment.adapter.out.messaging.dto.PaymentCompletedMessage;
import com.gym.payment.adapter.out.messaging.dto.PaymentExpiredMessage;
import com.gym.payment.adapter.out.messaging.dto.PaymentFailedMessage;
import com.gym.payment.domain.event.PaymentCompletedEvent;
import com.gym.payment.domain.event.PaymentExpiredEvent;
import com.gym.payment.domain.event.PaymentFailedEvent;
import com.gym.payment.domain.port.out.EventPublisherPort;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventPublisherAdapter implements EventPublisherPort {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaEventPublisherAdapter(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public void publish(String topic, Object event) {
        if (event instanceof PaymentCompletedEvent e) {
            PaymentCompletedMessage message = new PaymentCompletedMessage(
                    e.paymentId().toString(),
                    e.subscriptionId().toString(),
                    e.userId().toString(),
                    e.amount().toPlainString(),
                    e.currency(),
                    e.completedAt().toString()
            );
            kafkaTemplate.send(topic, e.paymentId().toString(), message);
        } else if (event instanceof PaymentFailedEvent e) {
            PaymentFailedMessage message = new PaymentFailedMessage(
                    e.paymentId().toString(),
                    e.subscriptionId().toString(),
                    e.userId().toString(),
                    e.failureReason()
            );
            kafkaTemplate.send(topic, e.paymentId().toString(), message);
        } else if (event instanceof PaymentExpiredEvent e) {
            PaymentExpiredMessage message = new PaymentExpiredMessage(
                    e.paymentId().toString(),
                    e.subscriptionId().toString(),
                    e.userId().toString(),
                    e.reason()
            );
            kafkaTemplate.send(topic, e.paymentId().toString(), message);
        }
    }
}
