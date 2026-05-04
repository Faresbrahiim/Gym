package com.gym.membershipservice.application.service.kafka;

import com.gym.membershipservice.application.dto.kafka.UserRegisteredEvent;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.UserMembership;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.UserSubscriptionCommandService;
import com.gym.membershipservice.application.port.UserSubscriptionQueryService;
import com.gym.membershipservice.application.port.kafka.UserRegistrationHandler;
import com.gym.membershipservice.infrastructure.repository.UserMembershipRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class UserRegistrationListenerImpl implements UserRegistrationHandler {

    private final UserSubscriptionQueryService subscriptionQueryService;
    private final UserSubscriptionCommandService subscriptionCommandService;
    private final PlanService planService;
    private final UserMembershipRepository userMembershipRepository;

    public UserRegistrationListenerImpl(UserSubscriptionQueryService subscriptionQueryService,
                                        UserSubscriptionCommandService subscriptionCommandService,
                                        PlanService planService,
                                        UserMembershipRepository userMembershipRepository) {
        this.subscriptionQueryService = subscriptionQueryService;
        this.subscriptionCommandService = subscriptionCommandService;
        this.planService              = planService;
        this.userMembershipRepository = userMembershipRepository;
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

        // Persist the user's email so subscriptions can be enriched for admin views
        userMembershipRepository.findByUserId(userId).ifPresentOrElse(
            existing -> {
                if (existing.getEmail() == null) {
                    existing.setEmail(event.getEmail());
                    userMembershipRepository.save(existing);
                }
            },
            () -> userMembershipRepository.save(new UserMembership(userId, event.getEmail()))
        );

        if (hasExistingSubscription(userId)) {
            log.info("User {} already has subscriptions. Skipping free plan.", userId);
            return;
        }

        Plan freePlan = planService.getFreePlan();
        subscriptionCommandService.createSubscription(userId, freePlan.getId());

        log.info("✅ Created free subscription for user {}", userId);
    }

    /**
     * Checks if the user already has a subscription to avoid duplicates.
     */
    private boolean hasExistingSubscription(UUID userId) {
        return !subscriptionQueryService.getUserSubscriptions(userId).isEmpty();
    }
}
