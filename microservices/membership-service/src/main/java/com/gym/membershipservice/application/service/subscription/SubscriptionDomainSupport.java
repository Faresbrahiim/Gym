package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SubscriptionDomainSupport {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionDomainSupport(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public Subscription findAndAutoExpire(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        if (sub.getEndDate() != null &&
                sub.getEndDate().isBefore(LocalDateTime.now()) &&
                sub.getStatus() == SubscriptionStatus.ACTIVE) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
        }

        return sub;
    }

    public Subscription findOwnedAndAutoExpire(UUID userId, UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findByIdAndUserId(subscriptionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));

        if (sub.getEndDate() != null &&
                sub.getEndDate().isBefore(LocalDateTime.now()) &&
                sub.getStatus() == SubscriptionStatus.ACTIVE) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
        }

        return sub;
    }

    public void validatePlanDuration(Plan plan) {
        if (plan.getDurationInDays() != null && plan.getDurationInDays() < 0) {
            throw new BadRequestException("Invalid plan duration");
        }
    }

    public void ensurePlanStatusAllowsChange(Subscription subscription) {
        SubscriptionStatus status = subscription.getStatus();
        if (status == SubscriptionStatus.ACTIVE) {
            return;
        }

        throw switch (status) {
            case PENDING_PAYMENT -> new BadRequestException("Plan changes are unavailable while payment is pending");
            case PAYMENT_FAILED -> new BadRequestException("Plan changes are unavailable until the payment issue is resolved");
            case PAUSED -> new BadRequestException("Resume your membership before changing plans");
            case FROZEN -> new BadRequestException("Plan changes are unavailable while the membership is frozen");
            default -> new BadRequestException("Only ACTIVE subscriptions can change plan");
        };
    }

    public void ensureSelfServicePlanSwitchAllowed(Subscription subscription) {
        Double currentPrice = subscription.getPlan().getPrice();
        boolean currentPlanIsFree = currentPrice == null || currentPrice == 0;
        if (currentPlanIsFree) {
            return;
        }

        throw new BadRequestException("Self-service plan changes between paid plans are not available right now");
    }
}
