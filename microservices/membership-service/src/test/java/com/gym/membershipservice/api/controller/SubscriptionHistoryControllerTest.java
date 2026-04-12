package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
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
class SubscriptionHistoryControllerTest {

    @Mock
    private SubscriptionHistoryService historyService;

    @InjectMocks
    private SubscriptionHistoryController controller;

    private UUID subscriptionId;
    private SubscriptionHistory history;

    @BeforeEach
    void setUp() {
        subscriptionId = UUID.randomUUID();

        Subscription sub = new Subscription();
        sub.setId(subscriptionId);

        history = new SubscriptionHistory();
        history.setSubscription(sub);
        history.setPreviousStatus(null);
        history.setNewStatus(SubscriptionStatus.ACTIVE);
        history.setChangedAt(LocalDateTime.now());
        history.setNote("Created");
    }

    // ── getHistory ──────────────────────────────────

    @Test
    void getHistory_returnsHistoryList() {
        when(historyService.getHistory(subscriptionId)).thenReturn(List.of(history));

        List<SubscriptionHistory> result = controller.getHistory(subscriptionId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNote()).isEqualTo("Created");
        assertThat(result.get(0).getNewStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(historyService).getHistory(subscriptionId);
    }

    @Test
    void getHistory_returnsEmptyList_whenNoHistory() {
        when(historyService.getHistory(subscriptionId)).thenReturn(List.of());

        List<SubscriptionHistory> result = controller.getHistory(subscriptionId);

        assertThat(result).isEmpty();
        verify(historyService).getHistory(subscriptionId);
    }

    @Test
    void getHistory_throwsException_whenSubscriptionNotFound() {
        when(historyService.getHistory(subscriptionId))
                .thenThrow(new ResourceNotFoundException("Subscription not found"));

        assertThatThrownBy(() -> controller.getHistory(subscriptionId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Subscription not found");
    }
}