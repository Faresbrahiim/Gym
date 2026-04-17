package com.gym.membershipservice.application.dto.kafka;

public class SubscriptionCreatedEvent {

    private String subscriptionId;
    private String userId;
    private String planName;

    public SubscriptionCreatedEvent() {}

    public SubscriptionCreatedEvent(String subscriptionId, String userId, String planName) {
        this.subscriptionId = subscriptionId;
        this.userId = userId;
        this.planName = planName;
    }

    public String getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
}
