package com.gym.notificationservice.application;

import com.gym.notificationservice.application.port.out.NotificationRealtimePublisher;
import com.gym.notificationservice.application.port.out.NotificationStore;
import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationStatus;
import com.gym.notificationservice.domain.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationStore notificationStore;
    private final NotificationRealtimePublisher notificationRealtimePublisher;

    public NotificationService(NotificationStore notificationStore,
                               NotificationRealtimePublisher notificationRealtimePublisher) {
        this.notificationStore = notificationStore;
        this.notificationRealtimePublisher = notificationRealtimePublisher;
    }

    public Notification createNotification(UUID userId, String title, String message, NotificationType type) {
        return createNotification(userId, title, message, type, null, null, null);
    }

    public Notification createNotification(
            UUID userId,
            String title,
            String message,
            NotificationType type,
            NotificationResourceType resourceType,
            String resourceId,
            String actionUrl
    ) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setResourceType(resourceType);
        notification.setResourceId(resourceId);
        notification.setActionUrl(actionUrl);

        Notification saved = notificationStore.save(notification);
        notificationRealtimePublisher.publish(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications(UUID userId) {
        return notificationStore.findAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationStore.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    public Notification markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationStore.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId, userId));

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());

        return notificationStore.save(notification);
    }

    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationStore.findAllByUserIdAndStatus(userId, NotificationStatus.UNREAD);

        LocalDateTime now = LocalDateTime.now();
        unread.forEach(n -> {
            n.setStatus(NotificationStatus.READ);
            n.setReadAt(now);
        });

        notificationStore.saveAll(unread);
    }

    public void markByResourceAsRead(UUID userId, NotificationResourceType resourceType, String resourceId) {
        List<Notification> unread = notificationStore.findByUserIdAndStatusAndResource(
                userId,
                NotificationStatus.UNREAD,
                resourceType,
                resourceId
        );

        if (unread.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        unread.forEach(n -> {
            n.setStatus(NotificationStatus.READ);
            n.setReadAt(now);
        });

        notificationStore.saveAll(unread);
    }
}
