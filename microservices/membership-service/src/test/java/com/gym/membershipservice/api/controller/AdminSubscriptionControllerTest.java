package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionService;
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
class AdminSubscriptionControllerTest {

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private AdminSubscriptionController controller;

    private UUID userId;
    private UUID subscriptionId;
    private SubscriptionResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        userId         = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();

        responseDTO = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.ACTIVE,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );
    }

    // ── getAll ──────────────────────────────────────

    @Test
    void getAll_returnsAllSubscriptions() {
        PagedResponseDTO<SubscriptionResponseDTO> page = PagedResponseDTO.of(List.of(responseDTO), 1, 10, 1);
        when(subscriptionService.getAllSubscriptions(1, 10, "ALL", null)).thenReturn(page);

        PagedResponseDTO<SubscriptionResponseDTO> result = controller.getAll(1, 10, "ALL", null);

        assertThat(result.items()).hasSize(1);
        assertThat(result.page()).isEqualTo(1);
        verify(subscriptionService).getAllSubscriptions(1, 10, "ALL", null);
    }

    @Test
    void getAll_returnsEmptyList_whenNoneExist() {
        PagedResponseDTO<SubscriptionResponseDTO> page = PagedResponseDTO.of(List.of(), 1, 10, 0);
        when(subscriptionService.getAllSubscriptions(1, 10, "ALL", null)).thenReturn(page);

        assertThat(controller.getAll(1, 10, "ALL", null).items()).isEmpty();
    }

    // ── getUserSubscriptions ────────────────────────

    @Test
    void getUserSubscriptions_returnsSubscriptionsForUser() {
        when(subscriptionService.getUserSubscriptions(userId)).thenReturn(List.of(responseDTO));

        List<SubscriptionResponseDTO> result = controller.getUserSubscriptions(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(userId);
        verify(subscriptionService).getUserSubscriptions(userId);
    }

    // ── cancel ──────────────────────────────────────

    @Test
    void cancel_returnsCancelledSubscription() {
        SubscriptionResponseDTO cancelled = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.CANCELLED,
                LocalDateTime.now(), LocalDateTime.now(),
                null, null
        );
        when(subscriptionService.cancelSubscription(subscriptionId)).thenReturn(cancelled);

        SubscriptionResponseDTO result = controller.cancel(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
        verify(subscriptionService).cancelSubscription(subscriptionId);
    }

    // ── freezeSubscription ──────────────────────────

    @Test
    void freezeSubscription_returnsFrozenSubscription() {
        String freezeEnd = LocalDateTime.now().plusDays(7).toString();
        SubscriptionResponseDTO frozen = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.FROZEN,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                LocalDateTime.now(), LocalDateTime.now().plusDays(7)
        );

        when(subscriptionService.freezeSubscription(eq(subscriptionId), any(LocalDateTime.class)))
                .thenReturn(frozen);

        SubscriptionResponseDTO result = controller.freezeSubscription(subscriptionId, freezeEnd);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.FROZEN);
        verify(subscriptionService).freezeSubscription(eq(subscriptionId), any(LocalDateTime.class));
    }

    @Test
    void freezeSubscription_throwsException_whenNotActive() {
        String freezeEnd = LocalDateTime.now().plusDays(7).toString();

        when(subscriptionService.freezeSubscription(eq(subscriptionId), any(LocalDateTime.class)))
                .thenThrow(new BadRequestException("Only ACTIVE subscriptions can be frozen"));

        assertThatThrownBy(() -> controller.freezeSubscription(subscriptionId, freezeEnd))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only ACTIVE subscriptions can be frozen");
    }

    // ── extend ──────────────────────────────────────

    @Test
    void extend_returnsExtendedSubscription() {
        when(subscriptionService.extendSubscription(subscriptionId, 10)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.extend(subscriptionId, 10);

        assertThat(result).isNotNull();
        verify(subscriptionService).extendSubscription(subscriptionId, 10);
    }

    @Test
    void extend_throwsException_whenExtraDaysInvalid() {
        when(subscriptionService.extendSubscription(subscriptionId, 0))
                .thenThrow(new BadRequestException("Extra days must be > 0"));

        assertThatThrownBy(() -> controller.extend(subscriptionId, 0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Extra days must be > 0");
    }

    // ── activate ────────────────────────────────────

    @Test
    void activate_returnsActivatedSubscription() {
        when(subscriptionService.activateSubscription(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.activate(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionService).activateSubscription(subscriptionId);
    }

    @Test
    void activate_throwsException_whenAlreadyActive() {
        when(subscriptionService.activateSubscription(subscriptionId))
                .thenThrow(new BadRequestException("Already active"));

        assertThatThrownBy(() -> controller.activate(subscriptionId))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Already active");
    }

    // ── approvePause ────────────────────────────────

    @Test
    void approvePause_returnsPausedSubscription() {
        SubscriptionResponseDTO paused = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.PAUSED,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );
        when(subscriptionService.approvePause(subscriptionId)).thenReturn(paused);

        SubscriptionResponseDTO result = controller.approvePause(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.PAUSED);
        verify(subscriptionService).approvePause(subscriptionId);
    }

    @Test
    void approvePause_throwsException_whenNoPauseRequest() {
        when(subscriptionService.approvePause(subscriptionId))
                .thenThrow(new BadRequestException("no pause request to approve"));

        assertThatThrownBy(() -> controller.approvePause(subscriptionId))
                .isInstanceOf(BadRequestException.class);
    }

    // ── rejectPause ─────────────────────────────────

    @Test
    void rejectPause_returnsActiveSubscription() {
        when(subscriptionService.rejectPause(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.rejectPause(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionService).rejectPause(subscriptionId);
    }

    @Test
    void rejectPause_throwsException_whenNoPauseRequest() {
        when(subscriptionService.rejectPause(subscriptionId))
                .thenThrow(new BadRequestException("no pause request to reject"));

        assertThatThrownBy(() -> controller.rejectPause(subscriptionId))
                .isInstanceOf(BadRequestException.class);
    }
}
