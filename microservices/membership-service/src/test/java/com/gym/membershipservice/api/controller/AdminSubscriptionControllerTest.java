package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
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
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        userId         = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();

        Plan plan = new Plan();
        plan.setName("Gold");

        subscription = new Subscription();
        subscription.setId(subscriptionId);
        subscription.setUserId(userId);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusDays(30));
    }

    // ── getAll ──────────────────────────────────────

    @Test
    void getAll_returnsAllSubscriptions() {
        when(subscriptionService.getAllSubscriptions()).thenReturn(List.of(subscription));

        List<Subscription> result = controller.getAll();

        assertThat(result).hasSize(1);
        verify(subscriptionService).getAllSubscriptions();
    }

    @Test
    void getAll_returnsEmptyList_whenNoneExist() {
        when(subscriptionService.getAllSubscriptions()).thenReturn(List.of());

        assertThat(controller.getAll()).isEmpty();
    }

    // ── getUserSubscriptions ────────────────────────

    @Test
    void getUserSubscriptions_returnsSubscriptionsForUser() {
        when(subscriptionService.getUserSubscriptions(userId)).thenReturn(List.of(subscription));

        List<Subscription> result = controller.getUserSubscriptions(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(userId);
        verify(subscriptionService).getUserSubscriptions(userId);
    }

    // ── cancel ──────────────────────────────────────

    @Test
    void cancel_returnsCancelledSubscription() {
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        when(subscriptionService.cancelSubscription(subscriptionId)).thenReturn(subscription);

        Subscription result = controller.cancel(subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
        verify(subscriptionService).cancelSubscription(subscriptionId);
    }

    // ── freezeSubscription ──────────────────────────

    @Test
    void freezeSubscription_returnsFrozenSubscription() {
        String freezeEnd = LocalDateTime.now().plusDays(7).toString();
        subscription.setStatus(SubscriptionStatus.FROZEN);

        when(subscriptionService.freezeSubscription(eq(subscriptionId), any(LocalDateTime.class)))
                .thenReturn(subscription);

        Subscription result = controller.freezeSubscription(subscriptionId, freezeEnd);

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
        when(subscriptionService.extendSubscription(subscriptionId, 10)).thenReturn(subscription);

        Subscription result = controller.extend(subscriptionId, 10);

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
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        when(subscriptionService.activateSubscription(subscriptionId)).thenReturn(subscription);

        Subscription result = controller.activate(subscriptionId);

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
        subscription.setStatus(SubscriptionStatus.PAUSED);
        when(subscriptionService.approvePause(subscriptionId)).thenReturn(subscription);

        Subscription result = controller.approvePause(subscriptionId);

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
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        when(subscriptionService.rejectPause(subscriptionId)).thenReturn(subscription);

        Subscription result = controller.rejectPause(subscriptionId);

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