package com.gym.notificationservice.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.notificationservice.adapter.in.kafka.dto.ChatMessageCreatedMessage;
import org.apache.kafka.common.serialization.Deserializer;

public class ChatMessageCreatedMessageDeserializer implements Deserializer<ChatMessageCreatedMessage> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatMessageCreatedMessageDeserializer() {}

    @Override
    public ChatMessageCreatedMessage deserialize(String topic, byte[] data) {
        try {
            if (data == null) return null;
            return objectMapper.readValue(data, ChatMessageCreatedMessage.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize ChatMessageCreatedMessage", e);
        }
    }
}
