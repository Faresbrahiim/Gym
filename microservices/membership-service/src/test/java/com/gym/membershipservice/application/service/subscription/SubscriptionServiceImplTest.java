package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.*;
import com.gym.membershipservice.application.enums.*;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.application.service.plan.PlanServiceImpl;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private SubscriptionHistoryService historyService;

    @Mock
    private PlanServiceImpl planService;

    @InjectMocks
    private SubscriptionServiceImpl service;

    private UUID userId;
    private UUID planId;
    private UUID subId;

    private Plan plan;
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        planId = UUID.randomUUID();
        subId  = UUID.randomUUID();

        plan = new Plan();
        plan.setId(planId);
        plan.setName("Basic");
        plan.setPrice(50.0);
        plan.setDurationInDays(30);
        plan.setStatus(PlanStatus.ACTIVE);

        subscription = new Subscription();
        subscription.setId(subId);
        subscription.setUserId(userId);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now().minusDays(1));
        subscription.setEndDate(LocalDateTime.now().plusDays(10));
    }

    // =========================
    // CREATE
    // =========================

    @Test
    void shouldCreateSubscription() {
        when(subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE))
                .thenReturn(false);
        when(planRepository.findById(planId))
                .thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.createSubscription(userId, planId);

        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());

        verify(subscriptionRepository).save(any());
        verify(historyService).recordChange(any(), isNull(),
                eq(SubscriptionStatus.ACTIVE), isNull(), eq("Created"));
    }

    @Test
    void shouldNotCreateIfActiveExists() {
        when(subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE))
                .thenReturn(true);

        assertThrows(ConflictException.class,
                () -> service.createSubscription(userId, planId));
    }

    // =========================
    // CANCEL
    // =========================

    @Test
    void shouldCancelSubscription() {
        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.cancelSubscription(subId);

        assertEquals(SubscriptionStatus.CANCELLED, result.getStatus());

        verify(subscriptionRepository).save(any());
        verify(historyService).recordChange(any(),
                eq(SubscriptionStatus.ACTIVE),
                eq(SubscriptionStatus.CANCELLED),
                isNull(),
                eq("Cancelled"));
    }

    // =========================
    // PAUSE FLOW
    // =========================

    @Test
    void shouldPauseSubscription() {
        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.pauseSubscription(subId);

        assertEquals(SubscriptionStatus.PAUSE_REQUESTED, result.getStatus());
    }

    @Test
    void shouldApprovePause() {
        subscription.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.approvePause(subId);

        assertEquals(SubscriptionStatus.PAUSED, result.getStatus());
    }

    @Test
    void shouldRejectPause() {
        subscription.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.rejectPause(subId);

        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
    }

    // =========================
    // RENEW
    // =========================

    @Test
    void shouldRenewSubscription() {
        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.renewSubscription(subId);

        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
    }

    // =========================
    // CHANGE PLAN
    // =========================

    @Test
    void shouldChangePlan() {
        Plan newPlan = new Plan();
        newPlan.setId(UUID.randomUUID());
        newPlan.setName("Premium");
        newPlan.setPrice(100.0);
        newPlan.setDurationInDays(30);
        newPlan.setStatus(PlanStatus.ACTIVE);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(planRepository.findById(newPlan.getId()))
                .thenReturn(Optional.of(newPlan));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.changePlan(subId, newPlan.getId());

        assertEquals(newPlan.getId(), result.getPlanId());
        assertEquals("Premium", result.getPlanName());
    }

    // =========================
    // UPGRADE / DOWNGRADE
    // =========================

    @Test
    void shouldUpgradePlan() {
        Plan expensive = new Plan();
        expensive.setId(UUID.randomUUID());
        expensive.setName("VIP");
        expensive.setPrice(200.0);
        expensive.setDurationInDays(30);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(planRepository.findById(expensive.getId()))
                .thenReturn(Optional.of(expensive));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.upgradeSubscription(subId, expensive.getId());

        assertEquals(expensive.getId(), result.getPlanId());
        assertEquals("VIP", result.getPlanName());
    }

    @Test
    void shouldFailUpgrade_whenNewPlanCheaper() {
        Plan cheaper = new Plan();
        cheaper.setId(UUID.randomUUID());
        cheaper.setPrice(10.0);
        cheaper.setDurationInDays(30);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(planRepository.findById(cheaper.getId()))
                .thenReturn(Optional.of(cheaper));

        assertThrows(BadRequestException.class,
                () -> service.upgradeSubscription(subId, cheaper.getId()));
    }

    @Test
    void shouldFailUpgrade_whenSubscriptionNotActive() {
        Plan expensive = new Plan();
        expensive.setId(UUID.randomUUID());
        expensive.setPrice(200.0);
        expensive.setDurationInDays(30);
        expensive.setStatus(PlanStatus.ACTIVE);

        subscription.setStatus(SubscriptionStatus.PAUSED);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(planRepository.findById(expensive.getId()))
                .thenReturn(Optional.of(expensive));

        assertThrows(BadRequestException.class,
                () -> service.upgradeSubscription(subId, expensive.getId()));
    }

    @Test
    void shouldFailDowngrade_whenSubscriptionPaymentFailed() {
        Plan cheaper = new Plan();
        cheaper.setId(UUID.randomUUID());
        cheaper.setPrice(10.0);
        cheaper.setDurationInDays(30);
        cheaper.setStatus(PlanStatus.ACTIVE);

        subscription.setStatus(SubscriptionStatus.PAYMENT_FAILED);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(planRepository.findById(cheaper.getId()))
                .thenReturn(Optional.of(cheaper));

        assertThrows(BadRequestException.class,
                () -> service.downgradeSubscription(subId, cheaper.getId()));
    }

    // =========================
    // EXTEND
    // =========================

    @Test
    void shouldExtendSubscription() {
        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.extendSubscription(subId, 5);

        assertNotNull(result.getEndDate());
        assertTrue(result.getEndDate().isAfter(LocalDateTime.now()));
    }

    @Test
    void shouldFailExtend_whenExtraDaysZero() {
        assertThrows(BadRequestException.class,
                () -> service.extendSubscription(subId, 0));
    }

    // =========================
    // FREEZE
    // =========================

    @Test
    void shouldFreezeSubscription() {
        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = service.freezeSubscription(subId, LocalDateTime.now().plusDays(2));

        assertEquals(SubscriptionStatus.FROZEN, result.getStatus());
    }

    @Test
    void shouldFailFreeze_whenFreezeEndInPast() {
        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));

        assertThrows(BadRequestException.class,
                () -> service.freezeSubscription(subId, LocalDateTime.now().minusDays(1)));
    }
}
