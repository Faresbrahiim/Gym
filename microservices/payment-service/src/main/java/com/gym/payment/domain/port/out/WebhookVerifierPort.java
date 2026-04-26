package com.gym.payment.domain.port.out;

public interface WebhookVerifierPort {
    VerifiedWebhook verify(String payload, String signatureHeader);
}
