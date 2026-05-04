package com.gym.membershipservice.application.service.membership;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.BookingEligibilityResponseDTO;
import com.gym.membershipservice.application.dto.common.MembershipEntitlementsResponseDTO;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.MembershipService;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
// NOTE : permissions are hardcoded
@Service
public class MembershipServiceImpl implements MembershipService {

    private final SubscriptionRepository subscriptionRepository;
    private final MembershipEntitlementResolver entitlementResolver;

    public MembershipServiceImpl(
            SubscriptionRepository subscriptionRepository,
            MembershipEntitlementResolver entitlementResolver
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.entitlementResolver = entitlementResolver;
    }

    @Override
    public SubscriptionStatus getUserStatus(UUID userId) {
        return subscriptionRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .map(Subscription::getStatus)
                .orElse(SubscriptionStatus.EXPIRED);
    }

    @Override
    public SubscriptionResponseDTO getActiveSubscription(UUID userId) {
        Subscription sub = subscriptionRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for user: " + userId));

        var plan = sub.getPlan();

        return new SubscriptionResponseDTO(
                sub.getId(),
                sub.getUserId(),
                null,
                plan.getId(),
                plan.getName(),
                plan.getPrice(),
                sub.getStatus(),
                sub.getStartDate(),
                sub.getEndDate(),
                sub.getFreezeStartDate(),
                sub.getFreezeEndDate()
        );
    }

    @Override
    public List<String> getPermissions(UUID userId) {
        MembershipEntitlementsResponseDTO entitlements = getEntitlements(userId);

        if (getUserStatus(userId) != SubscriptionStatus.ACTIVE) {
            return List.of();
        }

        java.util.ArrayList<String> permissions = new java.util.ArrayList<>(List.of("ACCESS_GYM", "BOOK_CLASSES"));
        if (entitlements.sessionBookingAllowed()) {
            permissions.add("BOOK_SESSION");
        }
        if (entitlements.aiCoachAllowed()) {
            permissions.add("USE_AI_COACH");
        }

        return permissions;
    }

    @Override
    public boolean validateMembership(UUID userId, String action) {
        return switch (action) {
            case "ENTER_GYM" -> hasActiveSubscription(userId);
            case "BOOK_SESSION" -> getBookingEligibility(userId).allowed();
            case "USE_AI_COACH" -> getEntitlements(userId).aiCoachAllowed();
            default -> false;
        };
    }

    @Override
    public BookingEligibilityResponseDTO getBookingEligibility(UUID userId) {
        return entitlementResolver.toBookingEligibility(getEntitlements(userId));
    }

    @Override
    public MembershipEntitlementsResponseDTO getEntitlements(UUID userId) {
        Subscription subscription = subscriptionRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .orElse(null);

        return entitlementResolver.resolve(subscription);
    }

    private boolean hasActiveSubscription(UUID userId) {
        return subscriptionRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .map(subscription -> subscription.getStatus() == SubscriptionStatus.ACTIVE)
                .orElse(false);
    }
}
