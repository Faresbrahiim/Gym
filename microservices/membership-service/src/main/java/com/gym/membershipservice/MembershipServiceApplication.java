package com.gym.membershipservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableKafka
@EnableScheduling
@SpringBootApplication
public class MembershipServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MembershipServiceApplication.class, args);
    }
}