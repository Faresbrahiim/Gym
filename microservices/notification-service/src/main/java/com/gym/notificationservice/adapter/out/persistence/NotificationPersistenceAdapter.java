package com.gym.notificationservice.adapter.out.persistence;

import com.gym.notificationservice.application.port.out.NotificationStore;
import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class NotificationPersistenceAdapter implements NotificationStore {

    private final SpringDataNotificationRepository repository;

    public NotificationPersistenceAdapter(SpringDataNotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Notification save(Notification notification) {
        return repository.save(notification);
    }

    @Override
    public List<Notification> saveAll(List<Notification> notifications) {
        return repository.saveAll(notifications);
    }

    @Override
    public List<Notification> findAllByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Notification> findAllByUserIdAndStatus(UUID userId, NotificationStatus status) {
        return repository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }

    @Override
    public long countByUserIdAndStatus(UUID userId, NotificationStatus status) {
        return repository.countByUserIdAndStatus(userId, status);
    }

    @Override
    public Optional<Notification> findByIdAndUserId(UUID notificationId, UUID userId) {
        return repository.findByIdAndUserId(notificationId, userId);
    }

    @Override
    public List<Notification> findByUserIdAndStatusAndResource(
            UUID userId,
            NotificationStatus status,
            NotificationResourceType resourceType,
            String resourceId
    ) {
        return repository.findByUserIdAndStatusAndResourceTypeAndResourceId(userId, status, resourceType, resourceId);
    }
}
