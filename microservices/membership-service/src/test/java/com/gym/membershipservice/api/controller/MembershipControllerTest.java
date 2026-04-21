package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.MembershipService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MembershipControllerTest {

    @Mock
    private MembershipService membershipService;

    @InjectMocks
    private MembershipController controller;

    private UUID userId;
    private SubscriptionResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        responseDTO = new SubscriptionResponseDTO(
                UUID.randomUUID(), userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.ACTIVE,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );
    }

    // ── getStatus ───────────────────────────────────

    @Test
    void getStatus_returnsActiveStatus() {
        when(membershipService.getUserStatus(userId)).thenReturn(SubscriptionStatus.ACTIVE);

        SubscriptionStatus result = controller.getStatus(userId);

        assertThat(result).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(membershipService).getUserStatus(userId);
    }

    @Test
    void getStatus_returnsExpired_whenNoSubscription() {
        when(membershipService.getUserStatus(userId)).thenReturn(SubscriptionStatus.EXPIRED);

        SubscriptionStatus result = controller.getStatus(userId);

        assertThat(result).isEqualTo(SubscriptionStatus.EXPIRED);
    }

    // ── getActiveSubscription ───────────────────────

    @Test
    void getActiveSubscription_returnsDTO() {
        when(membershipService.getActiveSubscription(userId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.getActiveSubscription(userId);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getPlanName()).isEqualTo("Gold");
        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(membershipService).getActiveSubscription(userId);
    }

    @Test
    void getActiveSubscription_throwsException_whenUserNotFound() {
        when(membershipService.getActiveSubscription(userId))
                .thenThrow(new ResourceNotFoundException("No subscription found for user: " + userId));

        assertThatThrownBy(() -> controller.getActiveSubscription(userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No subscription found");
    }

    // ── getPermissions ──────────────────────────────

    @Test
    void getPermissions_returnsPermissions_whenActive() {
        when(membershipService.getPermissions(userId))
                .thenReturn(List.of("ACCESS_GYM", "BOOK_CLASSES"));

        List<String> result = controller.getPermissions(userId);

        assertThat(result).containsExactly("ACCESS_GYM", "BOOK_CLASSES");
        verify(membershipService).getPermissions(userId);
    }

    @Test
    void getPermissions_returnsEmptyList_whenNotActive() {
        when(membershipService.getPermissions(userId)).thenReturn(List.of());

        List<String> result = controller.getPermissions(userId);

        assertThat(result).isEmpty();
    }

    @Test
    void getPermissions_throwsException_whenUserNotFound() {
        when(membershipService.getPermissions(userId))
                .thenThrow(new ResourceNotFoundException("No subscription found for user: " + userId));

        assertThatThrownBy(() -> controller.getPermissions(userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── validateMembership ──────────────────────────

    @Test
    void validateMembership_returnsTrue_whenActiveAndValidAction() {
        when(membershipService.validateMembership(userId, "ENTER_GYM")).thenReturn(true);

        boolean result = controller.validateMembership(userId, "ENTER_GYM");

        assertThat(result).isTrue();
        verify(membershipService).validateMembership(userId, "ENTER_GYM");
    }

    @Test
    void validateMembership_returnsFalse_whenInvalidAction() {
        when(membershipService.validateMembership(userId, "UNKNOWN_ACTION")).thenReturn(false);

        boolean result = controller.validateMembership(userId, "UNKNOWN_ACTION");

        assertThat(result).isFalse();
    }

    @Test
    void validateMembership_throwsException_whenUserNotFound() {
        when(membershipService.validateMembership(userId, "ENTER_GYM"))
                .thenThrow(new ResourceNotFoundException("No subscription found for user: " + userId));

        assertThatThrownBy(() -> controller.validateMembership(userId, "ENTER_GYM"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}