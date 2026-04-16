package com.gym.notificationservice.adapter.in.kafka.dto;

public class SubscriptionCreatedMessage {

    private String subscriptionId;
    private String userId;
    private String planName;

    public SubscriptionCreatedMessage() {}

    public String getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
}
