package com.gym.notificationservice.infrastructure.config;

import com.gym.notificationservice.adapter.in.kafka.dto.PaymentCompletedMessage;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentExpiredMessage;
import com.gym.notificationservice.adapter.in.kafka.dto.PaymentFailedMessage;
import com.gym.notificationservice.adapter.in.kafka.dto.ChatMessageCreatedMessage;
import com.gym.notificationservice.infrastructure.kafka.ChatMessageCreatedMessageDeserializer;
import com.gym.notificationservice.infrastructure.kafka.PaymentCompletedMessageDeserializer;
import com.gym.notificationservice.infrastructure.kafka.PaymentExpiredMessageDeserializer;
import com.gym.notificationservice.infrastructure.kafka.PaymentFailedMessageDeserializer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id:notification-service}")
    private String groupId;

    @Value("${spring.kafka.consumer.auto-offset-reset:latest}")
    private String autoOffsetReset;

    private Map<String, Object> baseConsumerProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        return props;
    }

    @Bean
    public ConsumerFactory<String, PaymentCompletedMessage> paymentCompletedConsumerFactory() {
        Map<String, Object> props = baseConsumerProps();
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, PaymentCompletedMessageDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentCompletedMessage> paymentCompletedKafkaListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentCompletedMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentCompletedConsumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, PaymentFailedMessage> paymentFailedConsumerFactory() {
        Map<String, Object> props = baseConsumerProps();
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, PaymentFailedMessageDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentFailedMessage> paymentFailedKafkaListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentFailedMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentFailedConsumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, PaymentExpiredMessage> paymentExpiredConsumerFactory() {
        Map<String, Object> props = baseConsumerProps();
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, PaymentExpiredMessageDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentExpiredMessage> paymentExpiredKafkaListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentExpiredMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentExpiredConsumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, ChatMessageCreatedMessage> chatMessageCreatedConsumerFactory() {
        Map<String, Object> props = baseConsumerProps();
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ChatMessageCreatedMessageDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ChatMessageCreatedMessage> chatMessageCreatedKafkaListenerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ChatMessageCreatedMessage> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(chatMessageCreatedConsumerFactory());
        return factory;
    }
}
