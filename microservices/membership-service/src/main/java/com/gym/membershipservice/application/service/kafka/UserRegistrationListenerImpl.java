package com.gym.membershipservice.application.service.kafka;

import com.gym.membershipservice.application.dto.kafka.UserRegisteredEvent;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.SubscriptionService;
import com.gym.membershipservice.application.port.kafka.UserRegistrationHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class UserRegistrationListenerImpl implements UserRegistrationHandler {

    private final SubscriptionService subscriptionService;
    private final PlanService planService;

    public UserRegistrationListenerImpl(SubscriptionService subscriptionService,
                                        PlanService planService) {
        this.subscriptionService = subscriptionService;
        this.planService = planService;
    }

    @KafkaListener(
            topics = "auth.user.registered",
            groupId = "membership-service-json",
            containerFactory = "userRegisteredEventKafkaListenerFactory"
    )
    @Override
    public void handleUserRegistered(UserRegisteredEvent event) {
        try {
            log.info("###################### RECEIVED EVENT: {}", event);
            processNewUser(event);
        } catch (Exception e) {
            log.error(" Failed to process UserRegisteredEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * Orchestrates processing of a newly registered user.
     */
    private void processNewUser(UserRegisteredEvent event) {
        UUID userId = event.getUserId();

        if (hasExistingSubscription(userId)) {
            log.info("User {} already has subscriptions. Skipping.", userId);
            return;
        }

        Plan freePlan = planService.getFreePlan();
        subscriptionService.createSubscription(userId, freePlan.getId());

        log.info("✅ Created free subscription for user {}", userId);
    }

    /**
     * Checks if the user already has a subscription to avoid duplicates.
     */
    private boolean hasExistingSubscription(UUID userId) {
        return !subscriptionService.getUserSubscriptions(userId).isEmpty();
    }
}