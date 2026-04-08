package com.gym.membershipservice.application.port;

import com.gym.membershipservice.application.entity.Subscription;
import com.gym.membershipservice.application.entity.SubscriptionHistory;
import com.gym.membershipservice.application.enums.SubscriptionStatus;

import java.util.List;
import java.util.UUID;

public interface SubscriptionHistoryService {

    SubscriptionHistory recordChange(
            Subscription subscription,
            SubscriptionStatus previousStatus,
            SubscriptionStatus newStatus,
            UUID changedBy,
            String note
    );

    List<SubscriptionHistory> getHistory(UUID subscriptionId);
}