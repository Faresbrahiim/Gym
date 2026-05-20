package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionRequestDTO;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.MembershipService;
import com.gym.membershipservice.application.port.SubscriptionHistoryQueryService;
import com.gym.membershipservice.application.port.UserSubscriptionCommandService;
import com.gym.membershipservice.application.port.UserSubscriptionQueryService;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserSubscriptionControllerTest {

    @Mock
    private UserSubscriptionQueryService subscriptionQueryService;

    @Mock
    private UserSubscriptionCommandService subscriptionCommandService;

    @Mock
    private SubscriptionHistoryQueryService subscriptionHistoryQueryService;

    @Mock
    private MembershipService membershipService;

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
        userId = UUID.randomUUID();
        planId = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();

        responseDTO = new SubscriptionResponseDTO(
                subscriptionId,
                userId,
                null,
                UUID.randomUUID(),
                "Gold",
                0.0,
                SubscriptionStatus.ACTIVE,
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(30),
                null,
                null
        );

        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    void createSubscription_returnsCreatedSubscription() {
        SubscriptionRequestDTO request = new SubscriptionRequestDTO();
        request.setPlanId(planId);

        when(subscriptionCommandService.createSubscription(userId, planId))
                .thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.createSubscription(jwt, request);

        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);

        verify(subscriptionCommandService).createSubscription(userId, planId);
    }

    @Test
    void getMySubscriptions_returnsUserSubscriptions() {
        when(subscriptionQueryService.getUserSubscriptions(userId))
                .thenReturn(List.of(responseDTO));

        List<SubscriptionResponseDTO> result = controller.getMySubscriptions(jwt);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(userId);

        verify(subscriptionQueryService).getUserSubscriptions(userId);
    }

    @Test
    void getMySubscriptions_returnsEmptyList_whenNone() {
        when(subscriptionQueryService.getUserSubscriptions(userId))
                .thenReturn(List.of());

        List<SubscriptionResponseDTO> result = controller.getMySubscriptions(jwt);

        assertThat(result).isEmpty();
    }

    @Test
    void cancelSubscription_returnsCancelledSubscription() {
        SubscriptionResponseDTO cancelled = new SubscriptionResponseDTO(
                subscriptionId,
                userId,
                null,
                UUID.randomUUID(),
                "Gold",
                0.0,
                SubscriptionStatus.CANCELLED,
                LocalDateTime.now(),
                LocalDateTime.now(),
                null,
                null
        );

        when(subscriptionCommandService.cancelSubscription(userId, subscriptionId))
                .thenReturn(cancelled);

        SubscriptionResponseDTO result = controller.cancelSubscription(jwt, subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);

        verify(subscriptionCommandService).cancelSubscription(userId, subscriptionId);
    }

    @Test
    void cancelSubscription_throwsException_whenNotFound() {
        when(subscriptionCommandService.cancelSubscription(userId, subscriptionId))
                .thenThrow(new ResourceNotFoundException("Subscription not found"));

        assertThatThrownBy(() -> controller.cancelSubscription(jwt, subscriptionId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void requestPause_returnsPauseRequestedSubscription() {
        SubscriptionResponseDTO paused = new SubscriptionResponseDTO(
                subscriptionId,
                userId,
                null,
                UUID.randomUUID(),
                "Gold",
                0.0,
                SubscriptionStatus.PAUSE_REQUESTED,
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(30),
                null,
                null
        );

        when(subscriptionCommandService.pauseSubscription(userId, subscriptionId))
                .thenReturn(paused);

        SubscriptionResponseDTO result = controller.requestPause(jwt, subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.PAUSE_REQUESTED);

        verify(subscriptionCommandService).pauseSubscription(userId, subscriptionId);
    }

    @Test
    void resumeSubscription_returnsActiveSubscription() {
        when(subscriptionCommandService.resumeSubscription(userId, subscriptionId))
                .thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.resumeSubscription(jwt, subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);

        verify(subscriptionCommandService).resumeSubscription(userId, subscriptionId);
    }

    @Test
    void renewSubscription_returnsRenewedSubscription() {
        when(subscriptionCommandService.renewSubscription(userId, subscriptionId))
                .thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.renewSubscription(jwt, subscriptionId);

        assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);

        verify(subscriptionCommandService).renewSubscription(userId, subscriptionId);
    }

    @Test
    void upgradeSubscription_returnsUpgradedSubscription() {
        UUID newPlanId = UUID.randomUUID();

        when(subscriptionCommandService.upgradeSubscription(userId, subscriptionId, newPlanId))
                .thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.upgradeSubscription(jwt, subscriptionId, newPlanId);

        assertThat(result).isNotNull();

        verify(subscriptionCommandService).upgradeSubscription(userId, subscriptionId, newPlanId);
    }

    @Test
    void downgradeSubscription_returnsDowngradedSubscription() {
        UUID newPlanId = UUID.randomUUID();

        when(subscriptionCommandService.downgradeSubscription(userId, subscriptionId, newPlanId))
                .thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.downgradeSubscription(jwt, subscriptionId, newPlanId);

        assertThat(result).isNotNull();

        verify(subscriptionCommandService).downgradeSubscription(userId, subscriptionId, newPlanId);
    }

    @Test
    void changePlan_returnsSubscriptionWithNewPlan() {
        UUID newPlanId = UUID.randomUUID();

        when(subscriptionCommandService.changePlan(userId, subscriptionId, newPlanId))
                .thenReturn(responseDTO);

        SubscriptionResponseDTO result = controller.changePlan(jwt, subscriptionId, newPlanId);

        assertThat(result).isNotNull();

        verify(subscriptionCommandService).changePlan(userId, subscriptionId, newPlanId);
    }
}