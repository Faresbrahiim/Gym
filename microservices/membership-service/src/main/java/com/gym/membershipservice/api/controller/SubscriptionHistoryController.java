package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.port.out.SubscriptionHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscription-history")
@Tag(name = "Subscription History", description = "Endpoints for viewing subscription history")
public class SubscriptionHistoryController {

    private final SubscriptionHistoryService historyService;

    public SubscriptionHistoryController(SubscriptionHistoryService historyService) {
        this.historyService = historyService;
    }

    @Operation(
            summary = "Get subscription history",
            description = "Retrieve the full history of a specific subscription by its UUID"
    )
    @Parameter(name = "subscriptionId", description = "UUID of the subscription", required = true)
    @GetMapping("/{subscriptionId}")
    public List<SubscriptionHistory> getHistory(@PathVariable UUID subscriptionId) {
        return historyService.getHistory(subscriptionId);
    }
}