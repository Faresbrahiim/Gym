package com.gym.membershipservice.application.service;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class MembershipService {

    private final SubscriptionRepository subscriptionRepository;

    // --- Constructor-based DI ---
    public MembershipService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    // --- Get the user's current subscription status ---
    public SubscriptionStatus getUserStatus(UUID userId) {
        return subscriptionRepository
                .findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .map(Subscription::getStatus)
                .orElse(null); // no active subscription
    }

    // --- Get the user's active subscription ---
    public Subscription getActiveSubscription(UUID userId) {
        return subscriptionRepository
                .findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active subscription found for user " + userId));
    }

    // --- Get user permissions based on subscription plan ---
    public List<String> getPermissions(UUID userId) {
        Subscription sub = getActiveSubscription(userId);

        // If not ACTIVE, return empty
        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            return List.of();
        }

        // Example permissions by plan name (you can expand later)
        return switch (sub.getPlan().getName()) {
            case "PREMIUM" -> List.of("ACCESS_GYM", "BOOK_CLASSES", "SPA_ACCESS");
            case "STANDARD" -> List.of("ACCESS_GYM", "BOOK_CLASSES");
            default -> List.of("ACCESS_GYM");
        };
    }

    // --- Validate membership for a specific action ---
    public boolean validateMembership(UUID userId, String action) {
        if (!subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)) {
            return false;
        }

        return switch (action) {
            case "ENTER_GYM" -> true;
            case "BOOK_CLASS" -> getPermissions(userId).contains("BOOK_CLASSES");
            case "SPA_ACCESS" -> getPermissions(userId).contains("SPA_ACCESS");
            default -> false;
        };
    }
}