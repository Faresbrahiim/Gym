package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.port.out.SubscriptionHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscription-history")
public class SubscriptionHistoryController {

    private final SubscriptionHistoryService historyService;

    public SubscriptionHistoryController(SubscriptionHistoryService historyService) {
        this.historyService = historyService;
    }

    // Get history for a specific subscription
    @GetMapping("/{subscriptionId}")
    public List<SubscriptionHistory> getHistory(@PathVariable UUID subscriptionId) {
        return historyService.getHistory(subscriptionId);
    }
}