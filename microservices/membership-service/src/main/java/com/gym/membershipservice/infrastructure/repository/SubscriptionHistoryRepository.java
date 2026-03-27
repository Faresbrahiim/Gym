package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.SubscriptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, UUID> {
    List<SubscriptionHistory> findBySubscriptionId(UUID subscriptionId);
}