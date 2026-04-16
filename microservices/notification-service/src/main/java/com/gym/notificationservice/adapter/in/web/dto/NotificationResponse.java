package com.gym.notificationservice.adapter.in.web.dto;

import com.gym.notificationservice.domain.NotificationStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        String title,
        String message,
        String type,
        NotificationStatus status,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {}
