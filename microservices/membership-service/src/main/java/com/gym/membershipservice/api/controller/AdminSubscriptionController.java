package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Subscription.AdminSubscriptionSummaryDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.port.AdminSubscriptionCommandService;
import com.gym.membershipservice.application.port.AdminSubscriptionQueryService;
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

    private final AdminSubscriptionQueryService subscriptionQueryService;
    private final AdminSubscriptionCommandService subscriptionCommandService;

    public AdminSubscriptionController(AdminSubscriptionQueryService subscriptionQueryService,
                                       AdminSubscriptionCommandService subscriptionCommandService) {
        this.subscriptionQueryService = subscriptionQueryService;
        this.subscriptionCommandService = subscriptionCommandService;
    }

    @GetMapping
    public PagedResponseDTO<SubscriptionResponseDTO> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) String search
    ) {
        return subscriptionQueryService.getAllSubscriptions(page, pageSize, status, search);
    }

    @GetMapping("/summary")
    public AdminSubscriptionSummaryDTO getSummary() {
        return subscriptionQueryService.getAdminSubscriptionSummary();
    }

    @GetMapping("/users/{userId}")
    public List<SubscriptionResponseDTO> getUserSubscriptions(@PathVariable UUID userId) {
        return subscriptionQueryService.getUserSubscriptions(userId);
    }

    @PostMapping("/{subscriptionId}/cancel")
    public SubscriptionResponseDTO cancel(@PathVariable UUID subscriptionId) {
        return subscriptionCommandService.cancelSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/freeze")
    public SubscriptionResponseDTO freezeSubscription(@PathVariable UUID subscriptionId,
                                                      @RequestParam String freezeEnd) {
        LocalDateTime freezeEndDate = LocalDateTime.parse(freezeEnd);
        return subscriptionCommandService.freezeSubscription(subscriptionId, freezeEndDate);
    }

    @PostMapping("/{subscriptionId}/extend")
    public SubscriptionResponseDTO extend(@PathVariable UUID subscriptionId,
                                          @RequestParam int extraDays) {
        return subscriptionCommandService.extendSubscription(subscriptionId, extraDays);
    }

    @PostMapping("/{subscriptionId}/activate")
    public SubscriptionResponseDTO activate(@PathVariable UUID subscriptionId) {
        return subscriptionCommandService.activateSubscription(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/approve")
    public SubscriptionResponseDTO approvePause(@PathVariable UUID subscriptionId) {
        return subscriptionCommandService.approvePause(subscriptionId);
    }

    @PostMapping("/{subscriptionId}/pause/reject")
    public SubscriptionResponseDTO rejectPause(@PathVariable UUID subscriptionId) {
        return subscriptionCommandService.rejectPause(subscriptionId);
    }
}
