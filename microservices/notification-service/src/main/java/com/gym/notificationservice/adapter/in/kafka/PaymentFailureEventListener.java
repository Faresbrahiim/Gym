package com.gym.notificationservice.adapter.in.kafka;

import com.gym.notificationservice.adapter.in.kafka.dto.PaymentExpiredMessage;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentFailedMessage;
import com.gym.notificationservice.application.NotificationService;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationType;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

@Component
public class PaymentFailureEventListener {

    private static final Logger log = LoggerFactory.getLogger(PaymentFailureEventListener.class);

    private final NotificationService notificationService;

    public PaymentFailureEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(
            topics = "payment.failed",
            groupId = "notification-service",
            containerFactory = "paymentFailedKafkaListenerFactory"
    )
    public void handlePaymentFailed(PaymentFailedMessage message) {
        try {
            UUID userId = UUID.fromString(message.getUserId());
            String subscriptionId = message.getSubscriptionId();

            notificationService.createNotification(
                    userId,
                    "Payment Failed",
                    "We couldn't confirm your membership payment. Please review your membership and try again.",
                    NotificationType.PAYMENT_FAILED,
                    NotificationResourceType.SUBSCRIPTION,
                    subscriptionId,
                    "/membership"
            );
        } catch (Exception e) {
            log.error("Failed to process payment.failed notification: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(
            topics = "payment.expired",
            groupId = "notification-service",
            containerFactory = "paymentExpiredKafkaListenerFactory"
    )
    public void handlePaymentExpired(PaymentExpiredMessage message) {
        try {
            UUID userId = UUID.fromString(message.getUserId());
            String subscriptionId = message.getSubscriptionId();

            notificationService.createNotification(
                    userId,
                    "Payment Expired",
                    "Your membership payment was not confirmed in time. Your current access was kept unchanged.",
                    NotificationType.PAYMENT_EXPIRED,
                    NotificationResourceType.SUBSCRIPTION,
                    subscriptionId,
                    "/membership"
            );
        } catch (Exception e) {
            log.error("Failed to process payment.expired notification: {}", e.getMessage(), e);
        }
    }
}
