package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID>, JpaSpecificationExecutor<Subscription> {

    // --- Find all subscriptions for a user ---
    List<Subscription> findByUserId(UUID userId);
    Optional<Subscription> findByIdAndUserId(UUID id, UUID userId);

    // --- Find a user’s active subscription ---
    Optional<Subscription> findByUserIdAndStatus(UUID userId, SubscriptionStatus status);

    // --- Check if user has a subscription with specific status ---
    boolean existsByUserIdAndStatus(UUID userId, SubscriptionStatus status);

    // --- Find subscriptions by status ---
    List<Subscription> findByStatus(SubscriptionStatus status);
    long countByStatus(SubscriptionStatus status);
    long countByStatusIn(List<SubscriptionStatus> statuses);

    // --- Find frozen subscriptions whose freeze ended ---
    List<Subscription> findByStatusAndFreezeEndDateBefore(SubscriptionStatus status, LocalDateTime dateTime);

    // --- Get the latest subscription of a user ---
    Optional<Subscription> findTopByUserIdOrderByStartDateDesc(UUID userId);
}
