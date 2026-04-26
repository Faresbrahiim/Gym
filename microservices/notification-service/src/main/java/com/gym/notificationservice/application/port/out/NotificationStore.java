package com.gym.notificationservice.application.port.out;

import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationStore {
    Notification save(Notification notification);
    List<Notification> saveAll(List<Notification> notifications);
    List<Notification> findAllByUserId(UUID userId);
    List<Notification> findAllByUserIdAndStatus(UUID userId, NotificationStatus status);
    long countByUserIdAndStatus(UUID userId, NotificationStatus status);
    Optional<Notification> findByIdAndUserId(UUID notificationId, UUID userId);
    List<Notification> findByUserIdAndStatusAndResource(
            UUID userId,
            NotificationStatus status,
            NotificationResourceType resourceType,
            String resourceId
    );
}
