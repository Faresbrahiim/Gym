package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.port.out.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@Tag(name = "Subscriptions", description = "Endpoints for managing user subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Operation(summary = "Create a subscription", description = "Create a new subscription for a user")
    @Parameter(name = "userId", description = "UUID of the user", required = true)
    @Parameter(name = "planId", description = "UUID of the plan", required = true)
    @PostMapping
    public Subscription createSubscription(@RequestParam UUID userId,
                                           @RequestParam UUID planId) {
        return subscriptionService.createSubscription(userId, planId);
    }

    @Operation(summary = "Get all subscriptions of a user", description = "Retrieve all subscriptions for a specific user")
    @Parameter(name = "userId", description = "UUID of the user", required = true)
    @GetMapping("/me")
    public List<Subscription> getMySubscriptions(@RequestParam UUID userId) {
        return subscriptionService.getUserSubscriptions(userId);
    }

    @Operation(summary = "Get subscription by ID", description = "Retrieve a subscription by its UUID")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @GetMapping("/{subscriptionId}")
    public Subscription getSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId);
    }

    @Operation(summary = "Cancel subscription", description = "Cancel a subscription if allowed")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription to cancel", required = true)
    @PostMapping("/{subscriptionId}/cancel")
    public Subscription cancelSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    @Operation(summary = "Request pause for subscription", description = "Request to pause an ACTIVE subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/pause")
    public Subscription requestPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.pauseSubscription(subscriptionId);
    }

    @Operation(summary = "Approve subscription pause", description = "Approve a pause request for a subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/pause/approve")
    public Subscription approvePause(@PathVariable UUID subscriptionId) {
        return subscriptionService.approvePause(subscriptionId);
    }

    @Operation(summary = "Reject subscription pause", description = "Reject a pause request for a subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/pause/reject")
    public Subscription rejectPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.rejectPause(subscriptionId);
    }

    @Operation(summary = "Resume subscription", description = "Resume a PAUSED subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/resume")
    public Subscription resumeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.resumeSubscription(subscriptionId);
    }

    @Operation(summary = "Renew subscription", description = "Renew an ACTIVE subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/renew")
    public Subscription renewSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.renewSubscription(subscriptionId);
    }

    @Operation(summary = "Upgrade subscription", description = "Upgrade subscription to a higher plan (logic in service)")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/upgrade")
    public Subscription upgradeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.upgradeSubscription(subscriptionId);
    }

    @Operation(summary = "Downgrade subscription", description = "Downgrade subscription to a lower plan (logic in service)")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @PostMapping("/{subscriptionId}/downgrade")
    public Subscription downgradeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.downgradeSubscription(subscriptionId);
    }

    @Operation(summary = "Change subscription plan", description = "Change the plan of an ACTIVE subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @Parameter(name = "newPlanId", description = "UUID of the new plan", required = true)
    @PostMapping("/{subscriptionId}/change-plan")
    public Subscription changePlan(@PathVariable UUID subscriptionId,
                                   @RequestParam UUID newPlanId) {
        return subscriptionService.changePlan(subscriptionId, newPlanId);
    }

    @Operation(summary = "Get subscription history", description = "Retrieve the history of a subscription")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @GetMapping("/{subscriptionId}/history")
    public List<SubscriptionHistory> getSubscriptionHistory(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionHistory(subscriptionId);
    }
}