package com.gym.notificationservice.adapter.in.kafka;

import com.gym.notificationservice.adapter.in.kafka.dto.PaymentCompletedMessage;
import com.gym.notificationservice.application.NotificationService;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationType;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

@Component
public class PaymentCompletedEventListener {

    private static final Logger log = LoggerFactory.getLogger(PaymentCompletedEventListener.class);

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
                    NotificationType.PAYMENT_COMPLETED,
                    NotificationResourceType.SUBSCRIPTION,
                    subscriptionId,
                    "/membership"
            );
        } catch (Exception e) {
            log.error("Failed to process payment.completed notification: {}", e.getMessage(), e);
        }
    }
}
