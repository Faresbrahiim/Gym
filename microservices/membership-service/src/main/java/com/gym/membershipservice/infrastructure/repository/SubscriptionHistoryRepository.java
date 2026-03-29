package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.SubscriptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, UUID> {

    // Corrected to query by the subscription's id through the relation
    List<SubscriptionHistory> findBySubscription_Id(UUID subscriptionId);
}