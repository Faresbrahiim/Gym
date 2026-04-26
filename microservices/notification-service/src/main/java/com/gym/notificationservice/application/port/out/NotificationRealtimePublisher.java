package com.gym.notificationservice.application.port.out;

import com.gym.notificationservice.domain.Notification;

public interface NotificationRealtimePublisher {
    void publish(Notification notification);
}
