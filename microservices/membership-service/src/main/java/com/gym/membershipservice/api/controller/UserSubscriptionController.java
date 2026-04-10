package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.port.SubscriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

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

    // =========================
    //  USER ACTIONS
    // =========================

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public Subscription createSubscription(@AuthenticationPrincipal Jwt jwt,
                                           @RequestParam UUID planId) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionService.createSubscription(userId, planId);
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public List<Subscription> getMySubscriptions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionService.getUserSubscriptions(userId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/cancel")
    public Subscription cancelSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/pause")
    public Subscription requestPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.pauseSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/resume")
    public Subscription resumeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.resumeSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/renew")
    public Subscription renewSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.renewSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/upgrade")
    public Subscription upgradeSubscription(@PathVariable UUID subscriptionId,
                                            @RequestParam UUID newPlanId) {
        return subscriptionService.upgradeSubscription(subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/downgrade")
    public Subscription downgradeSubscription(@PathVariable UUID subscriptionId,
                                              @RequestParam UUID newPlanId) {
        return subscriptionService.downgradeSubscription(subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{subscriptionId}/change-plan")
    public Subscription changePlan(@PathVariable UUID subscriptionId,
                                   @RequestParam UUID newPlanId) {
        return subscriptionService.changePlan(subscriptionId, newPlanId);
    }

    // =========================
    //  ADMIN ACTIONS
    // =========================

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{subscriptionId}")
    public Subscription getSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{subscriptionId}/history")
    public List<SubscriptionHistory> getHistory(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionHistory(subscriptionId);
    }
}