package com.gym.membershipservice.application.service.subscription;

import com.gym.membershipservice.api.mapper.SubscriptionMapper;
import com.gym.membershipservice.application.dto.Subscription.SubscriptionHistoryResponseDTO;
import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.enums.SubscriptionStatus;
import com.gym.membershipservice.application.port.SubscriptionHistoryService;
import com.gym.membershipservice.infrastructure.repository.SubscriptionHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionHistoryServiceImpl implements SubscriptionHistoryService {

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
    public List<SubscriptionHistoryResponseDTO> getHistoryForUser(UUID userId) {
        return SubscriptionMapper.toHistoryDTOList(
                repository.findBySubscription_UserIdOrderByChangedAtDesc(userId)
        );
    }
}
