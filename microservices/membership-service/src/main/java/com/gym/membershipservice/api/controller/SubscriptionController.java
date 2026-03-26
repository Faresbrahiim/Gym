package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.service.SubscriptionServiceImpl;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
public class SubscriptionController {

    private final SubscriptionServiceImpl service;

    public SubscriptionController(SubscriptionServiceImpl service) {
        this.service = service;
    }

    @GetMapping("/user/{userId}")
    public List<Subscription> getUserSubscriptions(@PathVariable UUID userId) {
        return service.getUserSubscriptions(userId);
    }
}