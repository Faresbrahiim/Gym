package com.gym.notificationservice.adapter.in.kafka;

import com.gym.notificationservice.adapter.in.kafka.dto.PaymentCompletedMessage;
import com.gym.notificationservice.application.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class PaymentCompletedEventListener {

    private static final String PAYMENT_COMPLETED_TYPE = "PAYMENT_COMPLETED";
    private static final String PAYMENT_RESOURCE_TYPE = "SUBSCRIPTION";

    private final NotificationService notificationService;

    public PaymentCompletedEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(
            topics = "payment.completed",
            groupId = "notification-service",
            containerFactory = "paymentCompletedKafkaListenerFactory"
    )
    public void handlePaymentCompleted(PaymentCompletedMessage message) {
        try {
            UUID userId = UUID.fromString(message.getUserId());
            String subscriptionId = message.getSubscriptionId();

            notificationService.createNotification(
                    userId,
                    "Payment Confirmed",
                    "Your membership payment was confirmed and your membership is now active.",
                    PAYMENT_COMPLETED_TYPE,
                    PAYMENT_RESOURCE_TYPE,
                    subscriptionId,
                    "/membership"
            );
        } catch (Exception e) {
            log.error("Failed to process payment.completed notification: {}", e.getMessage(), e);
        }
    }
}
