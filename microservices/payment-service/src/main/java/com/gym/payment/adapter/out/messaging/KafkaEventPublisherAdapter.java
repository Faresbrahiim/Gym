package com.gym.payment.adapter.out.messaging;

import com.gym.payment.adapter.out.messaging.dto.PaymentCompletedMessage;
import com.gym.payment.adapter.out.messaging.dto.PaymentExpiredMessage;
import com.gym.payment.adapter.out.messaging.dto.PaymentFailedMessage;
import com.gym.payment.adapter.out.messaging.dto.OrderPaymentCompletedMessage;
import com.gym.payment.adapter.out.messaging.dto.OrderPaymentExpiredMessage;
import com.gym.payment.adapter.out.messaging.dto.OrderPaymentFailedMessage;
import com.gym.payment.domain.event.OrderPaymentCompletedEvent;
import com.gym.payment.domain.event.OrderPaymentExpiredEvent;
import com.gym.payment.domain.event.OrderPaymentFailedEvent;
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
    public void publish(PaymentCompletedEvent event) {
        PaymentCompletedMessage message = new PaymentCompletedMessage(
                event.paymentId().toString(),
                event.subscriptionId().toString(),
                event.userId().toString(),
                event.amount().toPlainString(),
                event.currency(),
                event.completedAt().toString()
        );
        kafkaTemplate.send(PaymentTopicNames.MEMBERSHIP_COMPLETED, event.paymentId().toString(), message);
    }

    @Override
    public void publish(PaymentFailedEvent event) {
        PaymentFailedMessage message = new PaymentFailedMessage(
                event.paymentId().toString(),
                event.subscriptionId().toString(),
                event.userId().toString(),
                event.failureReason()
        );
        kafkaTemplate.send(PaymentTopicNames.MEMBERSHIP_FAILED, event.paymentId().toString(), message);
    }

    @Override
    public void publish(PaymentExpiredEvent event) {
        PaymentExpiredMessage message = new PaymentExpiredMessage(
                event.paymentId().toString(),
                event.subscriptionId().toString(),
                event.userId().toString(),
                event.reason()
        );
        kafkaTemplate.send(PaymentTopicNames.MEMBERSHIP_EXPIRED, event.paymentId().toString(), message);
    }

    @Override
    public void publish(OrderPaymentCompletedEvent event) {
        OrderPaymentCompletedMessage message = new OrderPaymentCompletedMessage(
                event.paymentId().toString(),
                event.orderId().toString(),
                event.userId().toString(),
                event.amount().toPlainString(),
                event.currency(),
                event.completedAt().toString()
        );
        kafkaTemplate.send(PaymentTopicNames.ORDER_COMPLETED, event.paymentId().toString(), message);
    }

    @Override
    public void publish(OrderPaymentFailedEvent event) {
        OrderPaymentFailedMessage message = new OrderPaymentFailedMessage(
                event.paymentId().toString(),
                event.orderId().toString(),
                event.userId().toString(),
                event.failureReason()
        );
        kafkaTemplate.send(PaymentTopicNames.ORDER_FAILED, event.paymentId().toString(), message);
    }

    @Override
    public void publish(OrderPaymentExpiredEvent event) {
        OrderPaymentExpiredMessage message = new OrderPaymentExpiredMessage(
                event.paymentId().toString(),
                event.orderId().toString(),
                event.userId().toString(),
                event.reason()
        );
        kafkaTemplate.send(PaymentTopicNames.ORDER_EXPIRED, event.paymentId().toString(), message);
    }
}
