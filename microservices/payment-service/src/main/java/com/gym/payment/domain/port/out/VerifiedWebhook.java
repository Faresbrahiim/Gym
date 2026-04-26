package com.gym.payment.domain.port.out;

import com.gym.payment.domain.model.WebhookEventType;

public record VerifiedWebhook(
        String eventId,
        String paymentIntentId,
        WebhookEventType eventType,
        String failureReason
) {}
