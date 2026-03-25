package com.gym.membershipservice.interfaces.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.service.SubscriptionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
public class SubscriptionController {

    private final SubscriptionService service;

    public SubscriptionController(SubscriptionService service) {
        this.service = service;
    }

    @GetMapping("/user/{userId}")
    public List<Subscription> getUserSubscriptions(@PathVariable UUID userId) {
        return service.getUserSubscriptions(userId);
    }
}