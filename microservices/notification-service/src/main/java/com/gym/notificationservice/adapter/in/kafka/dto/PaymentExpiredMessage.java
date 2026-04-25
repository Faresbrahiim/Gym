package com.gym.notificationservice.adapter.in.kafka.dto;

public class PaymentExpiredMessage {

    private String paymentId;
    private String subscriptionId;
    private String userId;
    private String reason;

    public PaymentExpiredMessage() {}

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
