package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.AdminSubscriptionCommandService;
import com.gym.membershipservice.application.port.AdminSubscriptionQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSubscriptionControllerTest {

    @Mock
    private AdminSubscriptionQueryService subscriptionQueryService;

    @Mock
    private AdminSubscriptionCommandService subscriptionCommandService;

    @InjectMocks
    private AdminSubscriptionController controller;

    private UUID userId;
    private UUID subscriptionId;
    private SubscriptionResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();

        responseDTO = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.ACTIVE,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );
    }

    @Test
    void getAll_returnsAllSubscriptions() {
        PagedResponseDTO<SubscriptionResponseDTO> page = PagedResponseDTO.of(List.of(responseDTO), 1, 10, 1);
        when(subscriptionQueryService.getAllSubscriptions(1, 10, "ALL", null)).thenReturn(page);

        PagedResponseDTO<SubscriptionResponseDTO> result = controller.getAll(1, 10, "ALL", null);

        assertThat(result.items()).hasSize(1);
        assertThat(result.page()).isEqualTo(1);
        verify(subscriptionQueryService).getAllSubscriptions(1, 10, "ALL", null);
    }

    @Test
    void getAll_returnsEmptyList_whenNoneExist() {
        PagedResponseDTO<SubscriptionResponseDTO> page = PagedResponseDTO.of(List.of(), 1, 10, 0);
        when(subscriptionQueryService.getAllSubscriptions(1, 10, "ALL", null)).thenReturn(page);

        assertThat(controller.getAll(1, 10, "ALL", null).items()).isEmpty();
    }

    @Test
    void getUserSubscriptions_returnsSubscriptionsForUser() {
        when(subscriptionQueryService.getUserSubscriptions(userId)).thenReturn(List.of(responseDTO));

        List<SubscriptionResponseDTO> result = controller.getUserSubscriptions(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(userId);
        verify(subscriptionQueryService).getUserSubscriptions(userId);
    }

    @Test
    void cancel_returnsCancelledSubscription() {
        SubscriptionResponseDTO cancelled = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.CANCELLED,
                LocalDateTime.now(), LocalDateTime.now(),
                null, null
        );
        when(subscriptionCommandService.cancelSubscription(subscriptionId)).thenReturn(cancelled);

        SubscriptionResponseDTO result = controller.cancel(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
        verify(subscriptionCommandService).cancelSubscription(subscriptionId);
    }

    @Test
    void freezeSubscription_returnsFrozenSubscription() {
        String freezeEnd = LocalDateTime.now().plusDays(7).toString();
        SubscriptionResponseDTO frozen = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.FROZEN,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                LocalDateTime.now(), LocalDateTime.now().plusDays(7)
        );

        when(subscriptionCommandService.freezeSubscription(eq(subscriptionId), any(LocalDateTime.class))).thenReturn(frozen);

        SubscriptionResponseDTO result = controller.freezeSubscription(subscriptionId, freezeEnd);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.FROZEN);
        verify(subscriptionCommandService).freezeSubscription(eq(subscriptionId), any(LocalDateTime.class));
    }

    @Test
    void freezeSubscription_throwsException_whenNotActive() {
        String freezeEnd = LocalDateTime.now().plusDays(7).toString();

        when(subscriptionCommandService.freezeSubscription(eq(subscriptionId), any(LocalDateTime.class)))
                .thenThrow(new BadRequestException("Only ACTIVE subscriptions can be frozen"));

        assertThatThrownBy(() -> controller.freezeSubscription(subscriptionId, freezeEnd))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Only ACTIVE subscriptions can be frozen");
    }

    @Test
    void extend_returnsExtendedSubscription() {
        when(subscriptionCommandService.extendSubscription(subscriptionId, 10)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.extend(subscriptionId, 10);

        assertThat(result).isNotNull();
        verify(subscriptionCommandService).extendSubscription(subscriptionId, 10);
    }

    @Test
    void extend_throwsException_whenExtraDaysInvalid() {
        when(subscriptionCommandService.extendSubscription(subscriptionId, 0))
                .thenThrow(new BadRequestException("Extra days must be > 0"));

        assertThatThrownBy(() -> controller.extend(subscriptionId, 0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Extra days must be > 0");
    }

    @Test
    void activate_returnsActivatedSubscription() {
        when(subscriptionCommandService.activateSubscription(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.activate(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionCommandService).activateSubscription(subscriptionId);
    }

    @Test
    void activate_throwsException_whenAlreadyActive() {
        when(subscriptionCommandService.activateSubscription(subscriptionId))
                .thenThrow(new BadRequestException("Already active"));

        assertThatThrownBy(() -> controller.activate(subscriptionId))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Already active");
    }

    @Test
    void approvePause_returnsPausedSubscription() {
        SubscriptionResponseDTO paused = new SubscriptionResponseDTO(
                subscriptionId, userId, null, UUID.randomUUID(), "Gold",
                0.0, SubscriptionStatus.PAUSED,
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                null, null
        );
        when(subscriptionCommandService.approvePause(subscriptionId)).thenReturn(paused);

        SubscriptionResponseDTO result = controller.approvePause(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.PAUSED);
        verify(subscriptionCommandService).approvePause(subscriptionId);
    }

    @Test
    void approvePause_throwsException_whenNoPauseRequest() {
        when(subscriptionCommandService.approvePause(subscriptionId))
                .thenThrow(new BadRequestException("no pause request to approve"));

        assertThatThrownBy(() -> controller.approvePause(subscriptionId))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectPause_returnsActiveSubscription() {
        when(subscriptionCommandService.rejectPause(subscriptionId)).thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.rejectPause(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionCommandService).rejectPause(subscriptionId);
    }

    @Test
    void rejectPause_throwsException_whenNoPauseRequest() {
        when(subscriptionCommandService.rejectPause(subscriptionId))
                .thenThrow(new BadRequestException("no pause request to reject"));

        assertThatThrownBy(() -> controller.rejectPause(subscriptionId))
                .isInstanceOf(BadRequestException.class);
    }
}
