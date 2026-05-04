package com.gym.membershipservice.infrastructure.scheduler;

import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryRecorder;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionSchedulerTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private SubscriptionHistoryRecorder historyService;

    private SubscriptionScheduler scheduler;

    private Subscription pendingNewSubscription;
    private Subscription pendingPlanChangeSubscription;

    @BeforeEach
    void setUp() {
        scheduler = new SubscriptionScheduler(subscriptionRepository, historyService, 10);

        pendingNewSubscription = new Subscription();
        pendingNewSubscription.setId(UUID.randomUUID());
        pendingNewSubscription.setStatus(SubscriptionStatus.PENDING_PAYMENT);
        pendingNewSubscription.setPendingPaymentStartedAt(LocalDateTime.now().minusMinutes(11));

        pendingPlanChangeSubscription = new Subscription();
        pendingPlanChangeSubscription.setId(UUID.randomUUID());
        pendingPlanChangeSubscription.setStatus(SubscriptionStatus.PENDING_PAYMENT);
        pendingPlanChangeSubscription.setPendingPaymentStartedAt(LocalDateTime.now().minusMinutes(11));
        pendingPlanChangeSubscription.setPlan(plan("Gold"));
        pendingPlanChangeSubscription.setPendingPlan(plan("Platinum"));
    }

    @Test
    void expirePendingPayments_marksNewPendingSubscriptionAsPaymentFailed() {
        when(subscriptionRepository.findByStatusAndPendingPaymentStartedAtBefore(eq(SubscriptionStatus.PENDING_PAYMENT), any(LocalDateTime.class)))
                .thenReturn(List.of(pendingNewSubscription));

        scheduler.expirePendingPayments();

        verify(subscriptionRepository).saveAndFlush(pendingNewSubscription);
        verify(historyService).recordChange(
                eq(pendingNewSubscription),
                eq(SubscriptionStatus.PENDING_PAYMENT),
                eq(SubscriptionStatus.PAYMENT_FAILED),
                isNull(),
                contains("Pending payment expired")
        );
    }

    @Test
    void expirePendingPayments_restoresActiveStatusForPendingPlanChange() {
        when(subscriptionRepository.findByStatusAndPendingPaymentStartedAtBefore(eq(SubscriptionStatus.PENDING_PAYMENT), any(LocalDateTime.class)))
                .thenReturn(List.of(pendingPlanChangeSubscription));

        scheduler.expirePendingPayments();

        verify(subscriptionRepository).saveAndFlush(pendingPlanChangeSubscription);
        verify(historyService).recordChange(
                eq(pendingPlanChangeSubscription),
                eq(SubscriptionStatus.PENDING_PAYMENT),
                eq(SubscriptionStatus.ACTIVE),
                isNull(),
                contains("current plan kept active")
        );
    }

    private Plan plan(String name) {
        Plan plan = new Plan();
        plan.setId(UUID.randomUUID());
        plan.setName(name);
        plan.setPrice(100.0);
        return plan;
    }
}
