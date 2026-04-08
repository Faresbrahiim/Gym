package com.gym.membershipservice.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.membershipservice.application.dto.kafka.UserRegisteredEvent;
import org.apache.kafka.common.serialization.Deserializer;

public class UserRegisteredEventDeserializer implements Deserializer<UserRegisteredEvent> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Public no-arg constructor
    public UserRegisteredEventDeserializer() {}

    @Override
    public UserRegisteredEvent deserialize(String topic, byte[] data) {
        try {
            if (data == null) return null;
            return objectMapper.readValue(data, UserRegisteredEvent.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize UserRegisteredEvent", e);
        }
    }
}