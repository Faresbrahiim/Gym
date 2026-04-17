package com.gym.notificationservice.adapter.out.websocket;

import com.gym.notificationservice.adapter.in.web.dto.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class WebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void pushNotification(UUID userId, NotificationResponse notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
            log.info("Pushed notification via WebSocket to userId={}", userId);
        } catch (Exception e) {
            log.error("Failed to push WebSocket notification to userId={}: {}", userId, e.getMessage(), e);
        }
    }
}
