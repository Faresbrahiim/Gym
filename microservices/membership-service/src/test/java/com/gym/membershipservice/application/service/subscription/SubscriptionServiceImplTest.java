package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.exception.BadRequestException;
import com.gym.membershipservice.api.exception.ConflictException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.PlanStatus;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.PlanService;
import com.gym.membershipservice.application.port.SubscriptionHistoryRecorder;
import com.gym.membershipservice.infrastructure.repository.PlanRepository;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private SubscriptionHistoryRecorder historyService;

    @Mock
    private PlanService planService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Mock
    private SubscriptionDomainSupport subscriptionDomainSupport;

    @InjectMocks
    private UserSubscriptionCommandServiceImpl userService;

    @InjectMocks
    private AdminSubscriptionCommandServiceImpl adminService;

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

    @Test
    void shouldCreateSubscription() {
        when(subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)).thenReturn(false);
        when(planRepository.findById(planId)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = userService.createSubscription(userId, planId);

        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
        verify(subscriptionRepository).save(any());
        verify(historyService).recordChange(any(), isNull(), eq(SubscriptionStatus.ACTIVE), isNull(), eq("Created"));
    }

    @Test
    void shouldNotCreateIfActiveExists() {
        when(subscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)).thenReturn(true);

        assertThrows(ConflictException.class, () -> userService.createSubscription(userId, planId));
    }

    @Test
    void shouldCancelSubscription() {
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = adminService.cancelSubscription(subId);

        assertEquals(SubscriptionStatus.CANCELLED, result.getStatus());
        verify(subscriptionRepository).save(any());
        verify(historyService).recordChange(any(), eq(SubscriptionStatus.ACTIVE), eq(SubscriptionStatus.CANCELLED), isNull(), eq("Cancelled"));
    }

    @Test
    void shouldPauseSubscription() {
        when(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subId)).thenReturn(subscription);
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = userService.pauseSubscription(userId, subId);

        assertEquals(SubscriptionStatus.PAUSE_REQUESTED, result.getStatus());
    }

    @Test
    void shouldApprovePause() {
        subscription.setStatus(SubscriptionStatus.PAUSE_REQUESTED);
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = adminService.approvePause(subId);

        assertEquals(SubscriptionStatus.PAUSED, result.getStatus());
    }

    @Test
    void shouldRejectPause() {
        subscription.setStatus(SubscriptionStatus.PAUSE_REQUESTED);
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = adminService.rejectPause(subId);

        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
    }

    @Test
    void shouldRenewSubscription() {
        when(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subId)).thenReturn(subscription);
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = userService.renewSubscription(userId, subId);

        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
    }

    @Test
    void shouldAllowChangePlanFromFreeToPaid() {
        subscription.getPlan().setPrice(0.0);

        Plan newPlan = new Plan();
        newPlan.setId(UUID.randomUUID());
        newPlan.setName("Premium");
        newPlan.setPrice(100.0);
        newPlan.setDurationInDays(30);
        newPlan.setStatus(PlanStatus.ACTIVE);

        when(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subId)).thenReturn(subscription);
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        doNothing().when(subscriptionDomainSupport).ensurePlanStatusAllowsChange(subscription);
        doNothing().when(subscriptionDomainSupport).ensureSelfServicePlanSwitchAllowed(subscription);
        doNothing().when(subscriptionDomainSupport).validatePlanDuration(newPlan);
        when(planRepository.findById(newPlan.getId())).thenReturn(Optional.of(newPlan));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = userService.changePlan(userId, subId, newPlan.getId());

        assertEquals(plan.getId(), result.getPlanId());
        assertEquals("Basic", result.getPlanName());
        assertEquals(SubscriptionStatus.PENDING_PAYMENT, result.getStatus());
        assertEquals(newPlan, subscription.getPendingPlan());
    }

    @Test
    void shouldBlockChangePlanBetweenPaidPlans() {
        Plan newPlan = new Plan();
        newPlan.setId(UUID.randomUUID());
        newPlan.setName("Premium");
        newPlan.setPrice(100.0);
        newPlan.setDurationInDays(30);
        newPlan.setStatus(PlanStatus.ACTIVE);

        when(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subId)).thenReturn(subscription);
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        doNothing().when(subscriptionDomainSupport).ensurePlanStatusAllowsChange(subscription);
        doThrow(new BadRequestException("Self-service plan changes between paid plans are not available right now"))
                .when(subscriptionDomainSupport).ensureSelfServicePlanSwitchAllowed(subscription);
        when(planRepository.findById(newPlan.getId())).thenReturn(Optional.of(newPlan));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> userService.changePlan(userId, subId, newPlan.getId()));

        assertEquals("Self-service plan changes between paid plans are not available right now", ex.getMessage());
        verify(planRepository).findById(newPlan.getId());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void shouldAlwaysBlockSelfServiceUpgrade() {
        Plan expensive = new Plan();
        expensive.setId(UUID.randomUUID());
        expensive.setName("VIP");
        expensive.setPrice(200.0);
        expensive.setDurationInDays(30);

        when(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subId)).thenReturn(subscription);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> userService.upgradeSubscription(userId, subId, expensive.getId()));

        assertEquals("Self-service plan changes between paid plans are not available right now", ex.getMessage());
        verify(planRepository, never()).findById(any());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void shouldAlwaysBlockSelfServiceDowngrade() {
        Plan cheaper = new Plan();
        cheaper.setId(UUID.randomUUID());
        cheaper.setPrice(10.0);
        cheaper.setDurationInDays(30);
        cheaper.setStatus(PlanStatus.ACTIVE);

        when(subscriptionDomainSupport.findOwnedAndAutoExpire(userId, subId)).thenReturn(subscription);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> userService.downgradeSubscription(userId, subId, cheaper.getId()));

        assertEquals("Self-service plan changes between paid plans are not available right now", ex.getMessage());
        verify(planRepository, never()).findById(any());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void shouldExtendSubscription() {
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = adminService.extendSubscription(subId, 5);

        assertNotNull(result.getEndDate());
        assertTrue(result.getEndDate().isAfter(LocalDateTime.now()));
    }

    @Test
    void shouldFailExtend_whenExtraDaysZero() {
        assertThrows(BadRequestException.class, () -> adminService.extendSubscription(subId, 0));
    }

    @Test
    void shouldFreezeSubscription() {
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionResponseDTO result = adminService.freezeSubscription(subId, LocalDateTime.now().plusDays(2));

        assertEquals(SubscriptionStatus.FROZEN, result.getStatus());
    }

    @Test
    void shouldFailFreeze_whenFreezeEndInPast() {
        when(subscriptionDomainSupport.findAndAutoExpire(subId)).thenReturn(subscription);

        assertThrows(BadRequestException.class,
                () -> adminService.freezeSubscription(subId, LocalDateTime.now().minusDays(1)));
    }
}
