package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.port.out.SubscriptionService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    // Create a subscription
    @PostMapping
    public Subscription createSubscription(@RequestParam UUID userId,
                                           @RequestParam UUID planId) {
        return subscriptionService.createSubscription(userId, planId);
    }

    // Get all subscriptions of a user
    @GetMapping("/me")
    public List<Subscription> getMySubscriptions(@RequestParam UUID userId) {
        return subscriptionService.getUserSubscriptions(userId);
    }

    //  Get subscription by ID
    @GetMapping("/{subscriptionId}")
    public Subscription getSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId);
    }

    //  Cancel subscription
    @PostMapping("/{subscriptionId}/cancel")
    public Subscription cancelSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    // Pause subscription
    @PostMapping("/{subscriptionId}/pause")
    public Subscription requestPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.pauseSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/approve")
    public Subscription approvePause(@PathVariable UUID subscriptionId) {
        return subscriptionService.approvePause(subscriptionId);
    }
    @PostMapping("/{subscriptionId}/pause/reject")
    public Subscription rejectPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.rejectPause(subscriptionId);
    }
    // Resume subscription
    @PostMapping("/{subscriptionId}/resume")
    public Subscription resumeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.resumeSubscription(subscriptionId);
    }

    //  Renew subscription
    @PostMapping("/{subscriptionId}/renew")
    public Subscription renewSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.renewSubscription(subscriptionId);
    }

    //  Upgrade subscription (if logic exists in service)
    @PostMapping("/{subscriptionId}/upgrade")
    public Subscription upgradeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.upgradeSubscription(subscriptionId);
    }

    //  Downgrade subscription (if logic exists in service)
    @PostMapping("/{subscriptionId}/downgrade")
    public Subscription downgradeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.downgradeSubscription(subscriptionId);
    }

    // Change plan
    @PostMapping("/{subscriptionId}/change-plan")
    public Subscription changePlan(@PathVariable UUID subscriptionId,
                                   @RequestParam UUID newPlanId) {
        return subscriptionService.changePlan(subscriptionId, newPlanId);
    }

    // Get subscription history
    @GetMapping("/{subscriptionId}/history")
    public List<SubscriptionHistory> getSubscriptionHistory(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionHistory(subscriptionId);
    }

}