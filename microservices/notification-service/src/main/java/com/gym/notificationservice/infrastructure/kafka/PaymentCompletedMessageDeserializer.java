package com.gym.notificationservice.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentCompletedMessage;
import org.apache.kafka.common.serialization.Deserializer;

public class PaymentCompletedMessageDeserializer implements Deserializer<PaymentCompletedMessage> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentCompletedMessageDeserializer() {}

    @Override
    public PaymentCompletedMessage deserialize(String topic, byte[] data) {
        try {
            if (data == null) return null;
            return objectMapper.readValue(data, PaymentCompletedMessage.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize PaymentCompletedMessage", e);
        }
    }
}
