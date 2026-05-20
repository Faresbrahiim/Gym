package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionRequestDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.BookingEligibilityResponseDTO;
import com.gym.membershipservice.application.dto.common.MembershipEntitlementsResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.port.AdminSubscriptionQueryService;
import com.gym.membershipservice.application.port.MembershipService;
import com.gym.membershipservice.application.port.SubscriptionHistoryQueryService;
import com.gym.membershipservice.application.port.UserSubscriptionCommandService;
import com.gym.membershipservice.application.port.UserSubscriptionQueryService;
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

    private final UserSubscriptionQueryService subscriptionQueryService;
    private final UserSubscriptionCommandService subscriptionCommandService;
    private final SubscriptionHistoryQueryService subscriptionHistoryQueryService;
    private final AdminSubscriptionQueryService adminSubscriptionQueryService;
    private final MembershipService membershipService;

    public UserSubscriptionController(UserSubscriptionQueryService subscriptionQueryService,
                                      UserSubscriptionCommandService subscriptionCommandService,
                                      SubscriptionHistoryQueryService subscriptionHistoryQueryService,
                                      AdminSubscriptionQueryService adminSubscriptionQueryService,
                                      MembershipService membershipService) {
        this.subscriptionQueryService = subscriptionQueryService;
        this.subscriptionCommandService = subscriptionCommandService;
        this.subscriptionHistoryQueryService = subscriptionHistoryQueryService;
        this.adminSubscriptionQueryService = adminSubscriptionQueryService;
        this.membershipService = membershipService;
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping
    public SubscriptionResponseDTO createSubscription(@AuthenticationPrincipal Jwt jwt,
                                                      @Valid @RequestBody SubscriptionRequestDTO dto) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.createSubscription(userId, dto.getPlanId());
    }

    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/me")
    public List<SubscriptionResponseDTO> getMySubscriptions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionQueryService.getUserSubscriptions(userId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/me/booking-eligibility")
    public BookingEligibilityResponseDTO getMyBookingEligibility(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return membershipService.getBookingEligibility(userId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/me/entitlements")
    public MembershipEntitlementsResponseDTO getMyEntitlements(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return membershipService.getEntitlements(userId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/me/history")
    public PagedResponseDTO<SubscriptionHistoryResponseDTO> getMySubscriptionHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionHistoryQueryService.getHistoryForUser(userId, page, pageSize);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/me/{subscriptionId}")
    public SubscriptionResponseDTO getMySubscription(@AuthenticationPrincipal Jwt jwt,
                                                     @PathVariable UUID subscriptionId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionQueryService.getUserSubscriptionById(userId, subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/cancel")
    public SubscriptionResponseDTO cancelSubscription(@AuthenticationPrincipal Jwt jwt,
                                                      @PathVariable UUID subscriptionId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.cancelSubscription(userId, subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/me/free")
    public SubscriptionResponseDTO activateFree(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.createFreeSubscription(userId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/pause")
    public SubscriptionResponseDTO requestPause(@AuthenticationPrincipal Jwt jwt,
                                                @PathVariable UUID subscriptionId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.pauseSubscription(userId, subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/resume")
    public SubscriptionResponseDTO resumeSubscription(@AuthenticationPrincipal Jwt jwt,
                                                      @PathVariable UUID subscriptionId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.resumeSubscription(userId, subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/renew")
    public SubscriptionResponseDTO renewSubscription(@AuthenticationPrincipal Jwt jwt,
                                                     @PathVariable UUID subscriptionId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.renewSubscription(userId, subscriptionId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/upgrade")
    public SubscriptionResponseDTO upgradeSubscription(@AuthenticationPrincipal Jwt jwt,
                                                       @PathVariable UUID subscriptionId,
                                                       @RequestParam UUID newPlanId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.upgradeSubscription(userId, subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/downgrade")
    public SubscriptionResponseDTO downgradeSubscription(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable UUID subscriptionId,
                                                         @RequestParam UUID newPlanId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.downgradeSubscription(userId, subscriptionId, newPlanId);
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/{subscriptionId}/change-plan")
    public SubscriptionResponseDTO changePlan(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable UUID subscriptionId,
                                              @RequestParam UUID newPlanId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return subscriptionCommandService.changePlan(userId, subscriptionId, newPlanId);
    }
//
//    @PreAuthorize("hasRole('ADMIN')")
//    @GetMapping("/{subscriptionId}")
//    public SubscriptionResponseDTO getSubscription(@PathVariable UUID subscriptionId) {
//        return adminSubscriptionQueryService.getSubscriptionById(subscriptionId);
//    }
//
//    @PreAuthorize("hasRole('ADMIN')")
//    @GetMapping("/{subscriptionId}/history")
//    public List<SubscriptionHistoryResponseDTO> getHistory(@PathVariable UUID subscriptionId) {
//        return subscriptionHistoryQueryService.getHistory(subscriptionId);
//    }
}
