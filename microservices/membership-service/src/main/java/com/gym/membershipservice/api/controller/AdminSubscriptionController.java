package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.port.SubscriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/subscriptions")
@Tag(name = "adminSubscriptions", description = "Admin subscription operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionController {

    private final SubscriptionService subscriptionService;

    public AdminSubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public List<SubscriptionResponseDTO> getAll() {
        return subscriptionService.getAllSubscriptions();
    }

    @GetMapping("/users/{userId}")
    public List<SubscriptionResponseDTO> getUserSubscriptions(@PathVariable UUID userId) {
        return subscriptionService.getUserSubscriptions(userId);
    }

    @PostMapping("/{subscriptionId}/cancel")
    public SubscriptionResponseDTO cancel(@PathVariable UUID subscriptionId) {
        return subscriptionService.cancelSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/freeze")
    public SubscriptionResponseDTO freezeSubscription(@PathVariable UUID subscriptionId,
                                                      @RequestParam String freezeEnd) {
        LocalDateTime freezeEndDate = LocalDateTime.parse(freezeEnd);
        return subscriptionService.freezeSubscription(subscriptionId, freezeEndDate);
    }

    @PostMapping("/{subscriptionId}/extend")
    public SubscriptionResponseDTO extend(@PathVariable UUID subscriptionId,
                                          @RequestParam int extraDays) {
        return subscriptionService.extendSubscription(subscriptionId, extraDays);
    }

    @PostMapping("/{subscriptionId}/activate")
    public SubscriptionResponseDTO activate(@PathVariable UUID subscriptionId) {
        return subscriptionService.activateSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/approve")
    public SubscriptionResponseDTO approvePause(@PathVariable UUID subscriptionId) {
        return subscriptionService.approvePause(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/reject")
    public SubscriptionResponseDTO rejectPause(@PathVariable UUID subscriptionId) {
        return subscriptionService.rejectPause(subscriptionId);
    }
}