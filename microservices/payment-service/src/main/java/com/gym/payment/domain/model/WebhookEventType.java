package com.gym.payment.domain.model;

public enum WebhookEventType {
    PAYMENT_SUCCEEDED,
    PAYMENT_FAILED,
    UNSUPPORTED;

    public static WebhookEventType fromStripeType(String stripeType) {
        return switch (stripeType) {
            case "payment_intent.succeeded" -> PAYMENT_SUCCEEDED;
            case "payment_intent.payment_failed" -> PAYMENT_FAILED;
            default -> UNSUPPORTED;
        };
    }
}
