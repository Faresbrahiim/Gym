package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionRequestDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.port.SubscriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping
    public SubscriptionResponseDTO createSubscription(@AuthenticationPrincipal Jwt jwt,
                                                      @Valid @RequestBody SubscriptionRequestDTO dto) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionService.createSubscription(userId, dto.getPlanId());
    }

    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/me")
    public List<SubscriptionResponseDTO> getMySubscriptions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionService.getUserSubscriptions(userId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/cancel")
    public SubscriptionResponseDTO cancelSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/me/free")
    public SubscriptionResponseDTO activateFree(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionService.createFreeSubscription(userId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/pause")
    public SubscriptionResponseDTO requestPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.pauseSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/resume")
    public SubscriptionResponseDTO resumeSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.resumeSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/renew")
    public SubscriptionResponseDTO renewSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.renewSubscription(subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/upgrade")
    public SubscriptionResponseDTO upgradeSubscription(@PathVariable UUID subscriptionId,
                                                       @RequestParam UUID newPlanId) {
        return subscriptionService.upgradeSubscription(subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/downgrade")
    public SubscriptionResponseDTO downgradeSubscription(@PathVariable UUID subscriptionId,
                                                         @RequestParam UUID newPlanId) {
        return subscriptionService.downgradeSubscription(subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/change-plan")
    public SubscriptionResponseDTO changePlan(@PathVariable UUID subscriptionId,
                                              @RequestParam UUID newPlanId) {
        return subscriptionService.changePlan(subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{subscriptionId}")
    public SubscriptionResponseDTO getSubscription(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionById(subscriptionId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{subscriptionId}/history")
    public List<SubscriptionHistoryResponseDTO> getHistory(@PathVariable UUID subscriptionId) {
        return subscriptionService.getSubscriptionHistory(subscriptionId);
    }
}