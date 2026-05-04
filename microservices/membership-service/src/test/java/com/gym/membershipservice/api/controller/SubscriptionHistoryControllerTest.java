package com.gym.membershipservice.api.controller;

import com.gym.membershipservice.api.exception.ResourceNotFoundException;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryQueryService;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionHistoryControllerTest {

    @Mock
    private SubscriptionHistoryQueryService historyService;

    @InjectMocks
    private SubscriptionHistoryController controller;

    private UUID subscriptionId;

    @BeforeEach
    void setUp() {
        subscriptionId = UUID.randomUUID();
    }

    @Test
    void getHistory_returnsHistoryList() {
        SubscriptionHistoryResponseDTO dto = new SubscriptionHistoryResponseDTO(
                UUID.randomUUID(),
                subscriptionId,
                null,
                SubscriptionStatus.ACTIVE,
                LocalDateTime.now(),
                UUID.randomUUID(),
                "Created"
        );

        when(historyService.getHistory(subscriptionId)).thenReturn(List.of(dto));

        List<SubscriptionHistoryResponseDTO> result = controller.getHistory(subscriptionId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNote()).isEqualTo("Created");
        assertThat(result.get(0).getNewStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(historyService).getHistory(subscriptionId);
    }

    @Test
    void getHistory_returnsEmptyList_whenNoHistory() {
        when(historyService.getHistory(subscriptionId)).thenReturn(List.of());

        List<SubscriptionHistoryResponseDTO> result = controller.getHistory(subscriptionId);

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
