package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.application.entity.*;
import com.gym.membershipservice.application.enums.*;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class SubscriptionServiceImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private SubscriptionHistoryService historyService;

    @Mock
    private PlanService planService;

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
        subId = UUID.randomUUID();

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

        Subscription result = service.createSubscription(userId, planId);

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

        Subscription result = service.cancelSubscription(subId);

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

        Subscription result = service.pauseSubscription(subId);

        assertEquals(SubscriptionStatus.PAUSE_REQUESTED, result.getStatus());
    }

    @Test
    void shouldApprovePause() {

        subscription.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));

        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        Subscription result = service.approvePause(subId);

        assertEquals(SubscriptionStatus.PAUSED, result.getStatus());
    }

    @Test
    void shouldRejectPause() {

        subscription.setStatus(SubscriptionStatus.PAUSE_REQUESTED);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));

        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        Subscription result = service.rejectPause(subId);

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

        Subscription result = service.renewSubscription(subId);

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

        Subscription result = service.changePlan(subId, newPlan.getId());

        assertEquals(newPlan, result.getPlan());
    }

    // =========================
    // UPGRADE / DOWNGRADE
    // =========================

    @Test
    void shouldUpgradePlan() {

        Plan expensive = new Plan();
        expensive.setId(UUID.randomUUID());
        expensive.setPrice(200.0);
        expensive.setDurationInDays(30);

        when(subscriptionRepository.findById(subId))
                .thenReturn(Optional.of(subscription));

        when(planRepository.findById(expensive.getId()))
                .thenReturn(Optional.of(expensive));

        when(subscriptionRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        Subscription result = service.upgradeSubscription(subId, expensive.getId());

        assertEquals(expensive, result.getPlan());
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

        Subscription result = service.extendSubscription(subId, 5);

        assertTrue(result.getEndDate().isAfter(LocalDateTime.now()));
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

        Subscription result = service.freezeSubscription(subId, LocalDateTime.now().plusDays(2));

        assertEquals(SubscriptionStatus.FROZEN, result.getStatus());
    }
}