package com.gym.payment.domain.port.in;

public record WebhookCommand(
        String stripeEventId,
        String stripePaymentIntentId,
        String eventType,
        String failureReason,
        String rawPayload,
        String stripeSignatureHeader
) {}
