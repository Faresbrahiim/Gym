package com.gym.notificationservice.adapter.out.persistence;

import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataNotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, NotificationStatus status);

    long countByUserIdAndStatus(UUID userId, NotificationStatus status);

    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    List<Notification> findByUserIdAndStatusAndResourceTypeAndResourceId(
            UUID userId,
            NotificationStatus status,
            NotificationResourceType resourceType,
            String resourceId
    );
}
