package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.application.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.dto.common.PagedResponseDTO;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryQueryService;
import com.gym.membershipservice.application.port.SubscriptionHistoryRecorder;
import com.gym.membershipservice.infrastructure.repository.SubscriptionHistoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionHistoryServiceImpl implements SubscriptionHistoryQueryService, SubscriptionHistoryRecorder {

    private final SubscriptionHistoryRepository repository;

    public SubscriptionHistoryServiceImpl(SubscriptionHistoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public SubscriptionHistory recordChange(Subscription subscription,
                                            SubscriptionStatus previousStatus,
                                            SubscriptionStatus newStatus,
                                            UUID changedBy,
                                            String note) {
        SubscriptionHistory history = new SubscriptionHistory();
        history.setSubscription(subscription);
        history.setPreviousStatus(previousStatus);
        history.setNewStatus(newStatus);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(changedBy);
        history.setNote(note);
        return repository.save(history);
    }

    @Override
    public List<SubscriptionHistoryResponseDTO> getHistory(UUID subscriptionId) {
        return SubscriptionMapper.toHistoryDTOList(
                repository.findBySubscription_Id(subscriptionId)
        );
    }

    @Override
    public PagedResponseDTO<SubscriptionHistoryResponseDTO> getHistoryForUser(UUID userId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(pageSize, 1));
        Page<SubscriptionHistory> historyPage = repository.findBySubscription_UserIdOrderByChangedAtDesc(userId, pageable);

        return PagedResponseDTO.of(
                SubscriptionMapper.toHistoryDTOList(historyPage.getContent()),
                page,
                pageSize,
                historyPage.getTotalElements()
        );
    }
}
