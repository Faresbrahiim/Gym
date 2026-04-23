package com.gym.notificationservice.application;

import com.gym.notificationservice.adapter.in.web.dto.NotificationResponse;
import com.gym.notificationservice.adapter.out.persistence.NotificationRepository;
import com.gym.notificationservice.adapter.out.websocket.WebSocketPublisher;
import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private static final String CHAT_NOTIFICATION_TYPE = "CHAT_MESSAGE_RECEIVED";

    private final NotificationRepository notificationRepository;
    private final WebSocketPublisher webSocketPublisher;

    public NotificationService(NotificationRepository notificationRepository,
                               WebSocketPublisher webSocketPublisher) {
        this.notificationRepository = notificationRepository;
        this.webSocketPublisher = webSocketPublisher;
    }

    public NotificationResponse createNotification(UUID userId, String title, String message, String type) {
        return createNotification(userId, title, message, type, null, null, null);
    }

    public NotificationResponse createNotification(
            UUID userId,
            String title,
            String message,
            String type,
            String resourceType,
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

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = toResponse(saved);

        webSocketPublisher.pushNotification(userId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(this::isChatNotification)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(this::isChatNotification)
                .filter(n -> n.getStatus() == NotificationStatus.UNREAD)
                .count();
    }

    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());

        return toResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(this::isChatNotification)
                .filter(n -> n.getStatus() == NotificationStatus.UNREAD)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        unread.forEach(n -> {
            n.setStatus(NotificationStatus.READ);
            n.setReadAt(now);
        });

        notificationRepository.saveAll(unread);
    }

    public void markByResourceAsRead(UUID userId, String resourceType, String resourceId) {
        List<Notification> unread = notificationRepository.findByUserIdAndStatusAndResourceTypeAndResourceId(
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

        notificationRepository.saveAll(unread);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getUserId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.getResourceType(),
                n.getResourceId(),
                n.getActionUrl(),
                n.getStatus(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }

    private boolean isChatNotification(Notification notification) {
        return CHAT_NOTIFICATION_TYPE.equals(notification.getType());
    }
}
