package com.gym.membershipservice.application.dto.kafka;


import java.util.UUID;

public class UserRegisteredEventDTO {
    private UUID userId;
    private String email;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UUID getPlanId() {
        return  userId ;
    }
}