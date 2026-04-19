package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionRequestDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserSubscriptionControllerTest {

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private UserSubscriptionController controller;

    @Mock
    private Jwt jwt;

    private UUID userId;
    private UUID planId;
    private UUID subscriptionId;
    private SubscriptionResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        userId         = UUID.randomUUID();
        planId         = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();

        responseDTO = new SubscriptionResponseDTO(
                subscriptionId, userId, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.ACTIVE,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );

        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    // ── createSubscription ──────────────────────────

    @Test
    void createSubscription_returnsCreatedSubscription() {
        SubscriptionRequestDTO request = new SubscriptionRequestDTO();
        request.setPlanId(planId);

        when(subscriptionService.createSubscription(userId, planId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.createSubscription(jwt, request);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionService).createSubscription(userId, planId);
    }

    // ── getMySubscriptions ──────────────────────────

    @Test
    void getMySubscriptions_returnsUserSubscriptions() {
        when(subscriptionService.getUserSubscriptions(userId)).thenReturn(List.of(responseDTO));

        List<SubscriptionResponseDTO> result = controller.getMySubscriptions(jwt);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(userId);
        verify(subscriptionService).getUserSubscriptions(userId);
    }

    @Test
    void getMySubscriptions_returnsEmptyList_whenNone() {
        when(subscriptionService.getUserSubscriptions(userId)).thenReturn(List.of());

        List<SubscriptionResponseDTO> result = controller.getMySubscriptions(jwt);

        assertThat(result).isEmpty();
    }

    // ── cancelSubscription ──────────────────────────

    @Test
    void cancelSubscription_returnsCancelledSubscription() {
        SubscriptionResponseDTO cancelled = new SubscriptionResponseDTO(
                subscriptionId, userId, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.CANCELLED,
                LocalDateTime.now(), LocalDateTime.now(),
                null, null
        );
        when(subscriptionService.cancelSubscription(subscriptionId)).thenReturn(cancelled);

        SubscriptionResponseDTO result = controller.cancelSubscription(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
        verify(subscriptionService).cancelSubscription(subscriptionId);
    }

    @Test
    void cancelSubscription_throwsException_whenNotFound() {
        when(subscriptionService.cancelSubscription(subscriptionId))
                .thenThrow(new ResourceNotFoundException("Subscription not found"));

        assertThatThrownBy(() -> controller.cancelSubscription(subscriptionId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── requestPause ────────────────────────────────

    @Test
    void requestPause_returnsPauseRequestedSubscription() {
        SubscriptionResponseDTO paused = new SubscriptionResponseDTO(
                subscriptionId, userId, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.PAUSE_REQUESTED,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );
        when(subscriptionService.pauseSubscription(subscriptionId)).thenReturn(paused);

        SubscriptionResponseDTO result = controller.requestPause(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.PAUSE_REQUESTED);
        verify(subscriptionService).pauseSubscription(subscriptionId);
    }

    // ── resumeSubscription ──────────────────────────

    @Test
    void resumeSubscription_returnsActiveSubscription() {
        when(subscriptionService.resumeSubscription(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.resumeSubscription(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionService).resumeSubscription(subscriptionId);
    }

    // ── renewSubscription ───────────────────────────

    @Test
    void renewSubscription_returnsRenewedSubscription() {
        when(subscriptionService.renewSubscription(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.renewSubscription(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionService).renewSubscription(subscriptionId);
    }

    // ── upgradeSubscription ─────────────────────────

    @Test
    void upgradeSubscription_returnsUpgradedSubscription() {
        UUID newPlanId = UUID.randomUUID();
        when(subscriptionService.upgradeSubscription(subscriptionId, newPlanId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.upgradeSubscription(subscriptionId, newPlanId);

        assertThat(result).isNotNull();
        verify(subscriptionService).upgradeSubscription(subscriptionId, newPlanId);
    }

    // ── downgradeSubscription ───────────────────────

    @Test
    void downgradeSubscription_returnsDowngradedSubscription() {
        UUID newPlanId = UUID.randomUUID();
        when(subscriptionService.downgradeSubscription(subscriptionId, newPlanId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.downgradeSubscription(subscriptionId, newPlanId);

        assertThat(result).isNotNull();
        verify(subscriptionService).downgradeSubscription(subscriptionId, newPlanId);
    }

    // ── changePlan ──────────────────────────────────

    @Test
    void changePlan_returnsSubscriptionWithNewPlan() {
        UUID newPlanId = UUID.randomUUID();
        when(subscriptionService.changePlan(subscriptionId, newPlanId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.changePlan(subscriptionId, newPlanId);

        assertThat(result).isNotNull();
        verify(subscriptionService).changePlan(subscriptionId, newPlanId);
    }

    // ── getSubscription (ADMIN) ─────────────────────

    @Test
    void getSubscription_returnsSubscription() {
        when(subscriptionService.getSubscriptionById(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.getSubscription(subscriptionId);

        assertThat(result.getSubscriptionId()).isEqualTo(subscriptionId);
        verify(subscriptionService).getSubscriptionById(subscriptionId);
    }

    @Test
    void getSubscription_throwsException_whenNotFound() {
        when(subscriptionService.getSubscriptionById(subscriptionId))
                .thenThrow(new ResourceNotFoundException("Subscription not found"));

        assertThatThrownBy(() -> controller.getSubscription(subscriptionId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── getHistory (ADMIN) ──────────────────────────

    @Test
    void getHistory_returnsSubscriptionHistory() {
        SubscriptionHistoryResponseDTO history = new SubscriptionHistoryResponseDTO(
                UUID.randomUUID(), subscriptionId,
                null, SubscriptionStatus.ACTIVE,
                LocalDateTime.now(), null, "Created"
        );
        when(subscriptionService.getSubscriptionHistory(subscriptionId))
                .thenReturn(List.of(history));

        List<SubscriptionHistoryResponseDTO> result = controller.getHistory(subscriptionId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNote()).isEqualTo("Created");
        verify(subscriptionService).getSubscriptionHistory(subscriptionId);
    }
}