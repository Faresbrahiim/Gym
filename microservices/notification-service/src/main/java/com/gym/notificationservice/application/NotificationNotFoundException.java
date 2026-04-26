package com.gym.notificationservice.application;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.UUID;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotificationNotFoundException extends RuntimeException {
    public NotificationNotFoundException(UUID notificationId, UUID userId) {
        super("Notification %s was not found for user %s".formatted(notificationId, userId));
    }
}
