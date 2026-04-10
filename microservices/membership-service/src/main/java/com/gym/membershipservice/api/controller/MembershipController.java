package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.MembershipService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
@RestController

@PreAuthorize("hasRole('SERVICE')")
@RequestMapping("/internal/memberships")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping("/{userId}/status")
    public SubscriptionStatus getStatus(@PathVariable UUID userId) {
        return membershipService.getUserStatus(userId);
    }

    @GetMapping("/{userId}")
    public SubscriptionResponseDTO getActiveSubscription(@PathVariable UUID userId) {
        return membershipService.getActiveSubscription(userId);
    }

    @GetMapping("/{userId}/permissions")
    public List<String> getPermissions(@PathVariable UUID userId) {
        return membershipService.getPermissions(userId);
    }

    @PostMapping("/validate")
    public boolean validateMembership(@RequestParam UUID userId,
                                      @RequestParam String action) {
        return membershipService.validateMembership(userId, action);
    }
}