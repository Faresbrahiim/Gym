package com.gym.membershipservice.application.service;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.List;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.port.out.SubscriptionService;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository repository;

    public SubscriptionServiceImpl(SubscriptionRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Subscription> getUserSubscriptions(UUID userId) {
        return repository.findByUserId(userId);
    }
}