package com.gym.membershipservice.application.service;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository repository;

    public SubscriptionService(SubscriptionRepository repository) {
        this.repository = repository;
    }

    public List<Subscription> getUserSubscriptions(UUID userId) {
        return repository.findByUserId(userId);
    }
}