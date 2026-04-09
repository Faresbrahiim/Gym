package com.gym.membershipservice.application.dto.kafka;


import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public class UserRegisteredEvent {

    @JsonProperty("UserId")
    private UUID userId;

    @JsonProperty("Email")
    private String email;

    public UserRegisteredEvent() {}

    public UserRegisteredEvent(UUID userId, String email) {
        this.userId = userId;
        this.email = email;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    @Override
    public String toString() {
        return "UserRegisteredEvent{" +
                "userId=" + userId +
                ", email='" + email + '\'' +
                '}';
    }
}