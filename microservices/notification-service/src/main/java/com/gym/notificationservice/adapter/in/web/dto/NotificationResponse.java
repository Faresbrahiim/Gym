package com.gym.notificationservice.adapter.in.web.dto;

import com.gym.notificationservice.domain.NotificationStatus;
import com.gym.notificationservice.domain.NotificationType;
import com.gym.notificationservice.domain.NotificationResourceType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        String title,
        String message,
        NotificationType type,
        NotificationResourceType resourceType,
        String resourceId,
        String actionUrl,
        NotificationStatus status,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {}
