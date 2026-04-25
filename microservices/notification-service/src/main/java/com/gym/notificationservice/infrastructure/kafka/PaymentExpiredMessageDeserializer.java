package com.gym.notificationservice.infrastructure.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentExpiredMessage;
import org.apache.kafka.common.serialization.Deserializer;

public class PaymentExpiredMessageDeserializer implements Deserializer<PaymentExpiredMessage> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentExpiredMessageDeserializer() {}

    @Override
    public PaymentExpiredMessage deserialize(String topic, byte[] data) {
        try {
            return objectMapper.readValue(data, PaymentExpiredMessage.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize PaymentExpiredMessage", e);
        }
    }
}
