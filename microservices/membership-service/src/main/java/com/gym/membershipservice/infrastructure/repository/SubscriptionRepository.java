package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    // Find all subscriptions by user
    List<Subscription> findByUserId(UUID userId);

    // Check if user has active subscription
    boolean existsByUserIdAndStatus(UUID userId, SubscriptionStatus status);

    // Find subscriptions by status
    List<Subscription> findByStatus(SubscriptionStatus status);


    // Optional: find subscriptions whose freeze period ended
    List<Subscription> findByStatusAndFreezeEndDateBefore(SubscriptionStatus status, LocalDateTime dateTime);

}