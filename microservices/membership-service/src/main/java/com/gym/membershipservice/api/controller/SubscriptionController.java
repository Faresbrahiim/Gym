package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.service.SubscriptionServiceImpl;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionServiceImpl subscriptionService;

    public SubscriptionController(SubscriptionServiceImpl subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    // 1️⃣ Create subscription
    @PostMapping
    public Subscription createSubscription(@RequestParam UUID userId,
                                           @RequestParam UUID planId) {
        return subscriptionService.createSubscription(userId, planId);
    }

    // 2️⃣ Get all subscriptions of a user
    @GetMapping("/me")
    public List<Subscription> getMySubscriptions(@RequestParam UUID userId) {
        return subscriptionService.getUserSubscriptions(userId);
    }

    // 3️⃣ Get subscription by ID
    @GetMapping("/{subscriptionId}")
    public Subscription getSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId);
    }
}