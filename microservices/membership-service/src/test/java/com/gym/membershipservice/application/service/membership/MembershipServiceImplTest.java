package com.gym.membershipservice.application.service.membership;

import com.gym.membershipservice.application.dto.Subscription.SubscriptionResponseDTO;
import com.gym.membershipservice.application.entity.Plan;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.infrastructure.repository.SubscriptionRepository;
import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MembershipServiceImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private MembershipServiceImpl membershipService;

    private UUID userId;
    private Subscription subscription;
    private Plan plan;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        plan = new Plan();
        plan.setId(UUID.randomUUID());
        plan.setName("Gold");

        subscription = new Subscription();
        subscription.setId(UUID.randomUUID());
        subscription.setUserId(userId);
        subscription.setPlan(plan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartDate(LocalDateTime.now().minusDays(1));
        subscription.setEndDate(LocalDateTime.now().plusDays(10));
    }

    // =========================
    // getUserStatus
    // =========================

    @Test
    void shouldReturnUserStatus_whenSubscriptionExists() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.of(subscription));

        SubscriptionStatus status = membershipService.getUserStatus(userId);

        assertEquals(SubscriptionStatus.ACTIVE, status);
    }

    @Test
    void shouldReturnExpired_whenNoSubscription() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.empty());

        SubscriptionStatus status = membershipService.getUserStatus(userId);

        assertEquals(SubscriptionStatus.EXPIRED, status);
    }

    // =========================
    // getActiveSubscription
    // =========================

    @Test
    void shouldReturnActiveSubscriptionDTO() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.of(subscription));

        SubscriptionResponseDTO dto = membershipService.getActiveSubscription(userId);

        assertNotNull(dto);
        assertEquals(userId, dto.getUserId());
        assertEquals("Gold", dto.getPlanName());
    }

    @Test
    void shouldThrow_whenNoSubscription() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> membershipService.getActiveSubscription(userId));
    }

    // =========================
    // getPermissions
    // =========================

    @Test
    void shouldReturnPermissions_whenActive() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.of(subscription));

        List<String> permissions = membershipService.getPermissions(userId);

        assertEquals(2, permissions.size());
        assertTrue(permissions.contains("ACCESS_GYM"));
        assertTrue(permissions.contains("BOOK_CLASSES"));
    }

    @Test
    void shouldReturnEmptyPermissions_whenNotActive() {
        subscription.setStatus(SubscriptionStatus.PAUSED);

        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.of(subscription));

        List<String> permissions = membershipService.getPermissions(userId);

        assertTrue(permissions.isEmpty());
    }

    // =========================
    // validateMembership
    // =========================

    @Test
    void shouldReturnTrue_whenActiveAndEnterGym() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.of(subscription));

        boolean result = membershipService.validateMembership(userId, "ENTER_GYM");

        assertTrue(result);
    }

    @Test
    void shouldReturnFalse_whenWrongAction() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.of(subscription));

        boolean result = membershipService.validateMembership(userId, "BOOK_CLASS");

        assertFalse(result);
    }

    @Test
    void shouldThrow_whenNoSubscription_validateMembership() {
        when(subscriptionRepository.findTopByUserIdOrderByStartDateDesc(userId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> membershipService.validateMembership(userId, "ENTER_GYM"));
    }
}