package com.gym.membershipservice.application.service.kafka;

import com.gym.membershipservice.application.dto.kafka.UserRegisteredEvent;
import com.gym.membershipservice.application.port.out.PlanService;
import com.gym.membershipservice.application.port.out.SubscriptionService;
import com.gym.membershipservice.application.service.SubscriptionServiceImpl;
import com.gym.membershipservice.application.service.PlanServiceImpl;
import com.gym.membershipservice.application.entity.Plan;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;
@Component
public class UserRegistrationListener {

    private final SubscriptionService subscriptionService;
    private final PlanService planService;

    public UserRegistrationListener(SubscriptionService subscriptionService,
                                    PlanService planService) {
        this.subscriptionService = subscriptionService;
        this.planService = planService;
    }

    @KafkaListener(
            topics = "auth.user.registered",
            groupId = "membership-service-json",
            containerFactory = "userRegisteredEventKafkaListenerFactory"
    )
    public void handleUserRegistered(UserRegisteredEvent event) {
        try {
            UUID userId = event.getUserId();
            System.out.println("🔥 RECEIVED EVENT: " + event);

            // Prevent duplicate subscriptions
            if (!subscriptionService.getUserSubscriptions(userId).isEmpty()) return;

            // Get default free plan
            Plan freePlan = planService.getFreePlan();

            // Create subscription
            subscriptionService.createSubscription(userId, freePlan.getId());
        } catch (Exception e) {
            // Log and swallow or handle properly
            System.err.println("❌ Failed to process UserRegisteredEvent: " + e.getMessage());
            e.printStackTrace();
            // optionally, you can rethrow to trigger retry
        }
    }
}