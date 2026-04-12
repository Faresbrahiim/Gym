package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.infrastructure.repository.SubscriptionHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class SubscriptionHistoryServiceImplTest {

    @Mock
    private SubscriptionHistoryRepository repository;

    @InjectMocks
    private SubscriptionHistoryServiceImpl service;

    private Subscription subscription;
    private UUID subId;

    @BeforeEach
    void setUp() {
        subId = UUID.randomUUID();

        subscription = new Subscription();
        subscription.setId(subId);
    }

    // =========================
    // RECORD CHANGE
    // =========================

    @Test
    void shouldRecordHistorySuccessfully() {

        when(repository.save(any(SubscriptionHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        SubscriptionHistory result = service.recordChange(
                subscription,
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.CANCELLED,
                UUID.randomUUID(),
                "test note"
        );

        assertNotNull(result);
        assertEquals(subscription, result.getSubscription());
        assertEquals(SubscriptionStatus.ACTIVE, result.getPreviousStatus());
        assertEquals(SubscriptionStatus.CANCELLED, result.getNewStatus());
        assertEquals("test note", result.getNote());

        verify(repository, times(1)).save(any(SubscriptionHistory.class));
    }

    // =========================
    // GET HISTORY
    // =========================

    @Test
    void shouldReturnHistoryList() {

        when(repository.findBySubscription_Id(subId))
                .thenReturn(List.of(new SubscriptionHistory(), new SubscriptionHistory()));

        List<SubscriptionHistory> result = service.getHistory(subId);

        assertEquals(2, result.size());
        verify(repository).findBySubscription_Id(subId);
    }
}