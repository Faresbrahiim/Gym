package com.gym.notificationservice.adapter.in.web.mapper;

import com.gym.notificationservice.adapter.in.web.dto.NotificationResponse;
import com.gym.notificationservice.domain.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationWebMapper {

    public NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getResourceType(),
                notification.getResourceId(),
                notification.getActionUrl(),
                notification.getStatus(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
