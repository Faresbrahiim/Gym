package com.gym.notificationservice.application;

import com.gym.notificationservice.adapter.in.web.dto.NotificationResponse;
import com.gym.notificationservice.adapter.out.persistence.NotificationRepository;
import com.gym.notificationservice.domain.Notification;
import com.gym.notificationservice.domain.NotificationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationResponse createNotification(UUID userId, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);

        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());

        return toResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> n.getStatus() == NotificationStatus.UNREAD)
                .toList();

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
                n.getStatus(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }
}
