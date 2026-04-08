package com.gym.membershipservice.application.service.membership;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.Plan;
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

    public MembershipServiceImpl(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
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
                .orElseThrow(() -> new RuntimeException("No subscription found for user: " + userId));

        Plan plan = sub.getPlan(); // Plan info

        return new SubscriptionResponseDTO(
                sub.getId(),
                sub.getUserId(),
                plan.getId(),
                plan.getName(),
                sub.getStatus(),
                sub.getStartDate(),
                sub.getEndDate(),
                sub.getFreezeStartDate(),
                sub.getFreezeEndDate()
        );
    }

    @Override
    public List<String> getPermissions(UUID userId) {
        Subscription sub = subscriptionRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .orElseThrow(() -> new RuntimeException("No subscription found for user: " + userId));

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) return List.of();

        return List.of("ACCESS_GYM", "BOOK_CLASSES");
    }

    @Override
    public boolean validateMembership(UUID userId, String action) {
        Subscription sub = subscriptionRepository
                .findTopByUserIdOrderByStartDateDesc(userId)
                .orElseThrow(() -> new RuntimeException("No subscription found for user: " + userId));

        return sub.getStatus() == SubscriptionStatus.ACTIVE && action.equals("ENTER_GYM");
    }
}