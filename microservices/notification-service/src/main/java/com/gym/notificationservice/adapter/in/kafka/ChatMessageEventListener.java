package com.gym.notificationservice.adapter.in.kafka;

import com.gym.notificationservice.adapter.in.kafka.dto.ChatMessageCreatedMessage;
import com.gym.notificationservice.application.NotificationService;
import com.gym.notificationservice.domain.NotificationResourceType;
import com.gym.notificationservice.domain.NotificationType;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class ChatMessageEventListener {

    private static final Logger log = LoggerFactory.getLogger(ChatMessageEventListener.class);

    private final NotificationService notificationService;

    public ChatMessageEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(
            topics = "chat.message.created",
            groupId = "notification-service",
            containerFactory = "chatMessageCreatedKafkaListenerFactory"
    )
    public void handleChatMessageCreated(ChatMessageCreatedMessage message) {
        try {
            log.info(
                    "Received chat.message.created for recipientUserId={} conversationId={}",
                    message.getRecipientUserId(),
                    message.getConversationId()
            );

            java.util.UUID recipientUserId = java.util.UUID.fromString(message.getRecipientUserId());
            String title = message.isGroup() ? "New group message" : "New message";
            String body = buildPreview(message);

            notificationService.createNotification(
                    recipientUserId,
                    title,
                    body,
                    NotificationType.CHAT_MESSAGE_RECEIVED,
                    NotificationResourceType.CONVERSATION,
                    message.getConversationId(),
                    "/chat?conversationId=" + message.getConversationId()
            );
        } catch (Exception e) {
            log.error("Failed to process chat.message.created notification: {}", e.getMessage(), e);
        }
    }

    private String buildPreview(ChatMessageCreatedMessage message) {
        String preview = truncate(message.getContent());
        if (message.isGroup() && message.getConversationName() != null && !message.getConversationName().isBlank()) {
            return message.getConversationName() + ": " + preview;
        }
        return preview;
    }

    private String truncate(String content) {
        if (content == null || content.isBlank()) {
            return "You received a new message.";
        }
        String compact = content.trim().replaceAll("\\s+", " ");
        return compact.length() > 120 ? compact.substring(0, 117) + "..." : compact;
    }
}
