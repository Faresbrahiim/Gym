package com.gym.notificationservice.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.notificationservice.adapter.in.kafka.dto.SubscriptionCreatedMessage;
import org.apache.kafka.common.serialization.Deserializer;

public class SubscriptionCreatedMessageDeserializer implements Deserializer<SubscriptionCreatedMessage> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SubscriptionCreatedMessageDeserializer() {}

    @Override
    public SubscriptionCreatedMessage deserialize(String topic, byte[] data) {
        try {
            if (data == null) return null;
            return objectMapper.readValue(data, SubscriptionCreatedMessage.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize SubscriptionCreatedMessage", e);
        }
    }
}
