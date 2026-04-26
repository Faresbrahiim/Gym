package com.gym.payment.domain.port.in;

import com.gym.payment.domain.model.WebhookEventType;

public record WebhookCommand(
        String stripeEventId,
        String stripePaymentIntentId,
        WebhookEventType eventType,
        String failureReason
) {}
