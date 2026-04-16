package com.gym.notificationservice.adapter.out.persistence;

import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndStatus(UUID userId, NotificationStatus status);
}
