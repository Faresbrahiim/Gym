package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.port.out.SubscriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/subscriptions")
@Tag(name = "adminSubscriptions", description = "admin subscription operations")

public class AdminSubscriptionController {

    private final SubscriptionService subscriptionService;

    public AdminSubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public List<Subscription> getAll() {
        return subscriptionService.getAllSubscriptions();
    }

    @GetMapping("/users/{userId}")
    public List<Subscription> getUserSubscriptions(@PathVariable UUID userId) {
        return subscriptionService.getUserSubscriptions(userId);
    }

    @PostMapping("/{subscriptionId}/cancel")
    public Subscription cancel(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/freeze")
    public Subscription freezeSubscription(@PathVariable UUID subscriptionId,
                                           @RequestParam String freezeEnd) {
        LocalDateTime freezeEndDate = LocalDateTime.parse(freezeEnd); // ISO format: 2026-03-28T15:30
        return subscriptionService.freezeSubscription(subscriptionId, freezeEndDate);
    }

    @PostMapping("/{subscriptionId}/extend")
    public Subscription extend(@PathVariable UUID subscriptionId,
                               @RequestParam int extraDays) {
        return subscriptionService.extendSubscription(subscriptionId, extraDays);
    }

    @PostMapping("/{subscriptionId}/activate")
    public Subscription activate(@PathVariable UUID subscriptionId) {
        return subscriptionService.activateSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/approve")
    public Subscription approvePause(@PathVariable UUID subscriptionId) {
        return subscriptionService.approvePause(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/reject")
    public Subscription rejectPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.rejectPause(subscriptionId);
    }
}