package com.gym.membershipservice.infrastructure.repository;

import com.gym.membershipservice.application.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    List<Subscription> findByUserId(UUID userId);
}