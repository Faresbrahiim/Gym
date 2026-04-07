package com.gym.membershipservice.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.membershipservice.application.port.out.SubscriptionService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserRegisteredListener {

    private final SubscriptionService subscriptionService;
    private final ObjectMapper objectMapper;

    // Replace this with the actual default plan UUID from your DB
    private static final UUID DEFAULT_PLAN_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    public UserRegisteredListener(SubscriptionService subscriptionService, ObjectMapper objectMapper) {
        this.subscriptionService = subscriptionService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "auth.user.registered", groupId = "membership-service")
    public void handleUserRegistered(String message) {
        System.out.println("[DEBUG] Received user event: " + message);

        try {
            // Parse message JSON into DTO
            UserRegisteredEvent event = objectMapper.readValue(message, UserRegisteredEvent.class);

            UUID userId = event.getUserId();
            if (userId == null) {
                System.out.println("[WARN] userId is null in the event, skipping subscription creation.");
                return;
            }

            System.out.println("[DEBUG] Creating subscription for user: " + userId +
                    " with default plan: " + DEFAULT_PLAN_ID);

            subscriptionService.createSubscription(userId, DEFAULT_PLAN_ID);

            System.out.println("[INFO] Subscription created successfully for user: " + userId);

        } catch (Exception e) {
            System.err.println("[ERROR] Failed to process user registration event: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Inner DTO class to parse Kafka JSON message
    public static class UserRegisteredEvent {
        private UUID userId;
        private String email; // optional

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}