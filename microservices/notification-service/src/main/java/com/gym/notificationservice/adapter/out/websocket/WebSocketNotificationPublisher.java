package com.gym.notificationservice.adapter.out.websocket;

import com.gym.notificationservice.application.port.out.NotificationRealtimePublisher;
import com.gym.notificationservice.domain.Notification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class WebSocketNotificationPublisher implements NotificationRealtimePublisher {

    private static final Logger log = LoggerFactory.getLogger(WebSocketNotificationPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketNotificationPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void publish(Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    notification.getUserId().toString(),
                    "/queue/notifications",
                    notification
            );
            log.info("Pushed notification via WebSocket to userId={}", notification.getUserId());
        } catch (Exception e) {
            log.error("Failed to push WebSocket notification to userId={}: {}", notification.getUserId(), e.getMessage(), e);
        }
    }
}
