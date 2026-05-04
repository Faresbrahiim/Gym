package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.port.SubscriptionHistoryQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscription-history")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Subscription History", description = "Endpoints for viewing subscription history")
public class SubscriptionHistoryController {

    private final SubscriptionHistoryQueryService historyService;

    public SubscriptionHistoryController(SubscriptionHistoryQueryService historyService) {
        this.historyService = historyService;
    }

    @Operation(summary = "Get subscription history")
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @GetMapping("/{subscriptionId}")
    public List<SubscriptionHistoryResponseDTO> getHistory(@PathVariable UUID subscriptionId) {
        return historyService.getHistory(subscriptionId);
    }
}
