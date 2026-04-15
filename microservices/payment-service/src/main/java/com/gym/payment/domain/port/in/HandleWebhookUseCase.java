package com.gym.payment.domain.port.in;

public interface HandleWebhookUseCase {
    void execute(WebhookCommand command);
}
