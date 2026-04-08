package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.port.SubscriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@Tag(name = "userSubscriptions", description = "User subscription operations")
public class UserSubscriptionController {

    private final SubscriptionService subscriptionService;

    public UserSubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    public Subscription createSubscription(@RequestParam UUID userId,
                                           @RequestParam UUID planId) {
        return subscriptionService.createSubscription(userId, planId);
    }

    @GetMapping("/me")
    public List<Subscription> getMySubscriptions(@RequestParam UUID userId) {
        return subscriptionService.getUserSubscriptions(userId);
    }

    @GetMapping("/{subscriptionId}")
    public Subscription getSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/cancel")
    public Subscription cancelSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause")
    public Subscription requestPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.pauseSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/resume")
    public Subscription resumeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.resumeSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/renew")
    public Subscription renewSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.renewSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/upgrade")
    public Subscription upgradeSubscription(@PathVariable UUID subscriptionId,
                                            @RequestParam UUID newPlanId) {
        return subscriptionService.upgradeSubscription(subscriptionId, newPlanId);
    }

    @PostMapping("/{subscriptionId}/downgrade")
    public Subscription downgradeSubscription(@PathVariable UUID subscriptionId,
                                              @RequestParam UUID newPlanId) {
        return subscriptionService.downgradeSubscription(subscriptionId, newPlanId);
    }

    @PostMapping("/{subscriptionId}/change-plan")
    public Subscription changePlan(@PathVariable UUID subscriptionId,
                                   @RequestParam UUID newPlanId) {
        return subscriptionService.changePlan(subscriptionId, newPlanId);
    }

    @GetMapping("/{subscriptionId}/history")
    public List<SubscriptionHistory> getHistory(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionHistory(subscriptionId);
    }
}