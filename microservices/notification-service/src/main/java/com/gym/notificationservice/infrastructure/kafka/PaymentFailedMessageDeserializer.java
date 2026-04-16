package com.gym.notificationservice.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentFailedMessage;
import org.apache.kafka.common.serialization.Deserializer;

public class PaymentFailedMessageDeserializer implements Deserializer<PaymentFailedMessage> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentFailedMessageDeserializer() {}

    @Override
    public PaymentFailedMessage deserialize(String topic, byte[] data) {
        try {
            if (data == null) return null;
            return objectMapper.readValue(data, PaymentFailedMessage.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize PaymentFailedMessage", e);
        }
    }
}
