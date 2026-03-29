package com.gym.membershipservice.test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class KafkaTestProducer implements CommandLineRunner {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Send a test message to "test-topic"
        kafkaTemplate.send("test-topic", "Hello from Spring Boot!");
        System.out.println("Message sent to Kafka!");
    }
}