package com.gym.membershipservice.application.port.kafka;
import com.gym.membershipservice.application.dto.kafka.UserRegisteredEvent;
public interface UserRegistrationHandler {

    public void handleUserRegistered(UserRegisteredEvent event) ;
}