package com.gym.notificationservice.adapter.in.kafka;

import com.gym.notificationservice.adapter.in.kafka.dto.SubscriptionCreatedMessage;
import com.gym.notificationservice.application.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SubscriptionEventListener {

    private final NotificationService notificationService;

    public SubscriptionEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(
            topics = "subscription.created",
            groupId = "notification-service",
            containerFactory = "subscriptionCreatedKafkaListenerFactory"
    )
    public void handleSubscriptionCreated(SubscriptionCreatedMessage message) {
        try {
            log.info("Received subscription.created for userId={}", message.getUserId());

            java.util.UUID userId = java.util.UUID.fromString(message.getUserId());

            notificationService.createNotification(
                    userId,
                    "Subscription Created",
                    "Your subscription to " + message.getPlanName() + " has been created successfully.",
                    "SUBSCRIPTION_CREATED"
            );

        } catch (Exception e) {
            log.error("Failed to process subscription.created notification: {}", e.getMessage(), e);
        }
    }
}
