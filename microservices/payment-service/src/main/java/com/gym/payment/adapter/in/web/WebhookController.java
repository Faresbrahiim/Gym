package com.gym.payment.adapter.in.web;

import com.gym.payment.domain.exception.WebhookSignatureException;
import com.gym.payment.domain.port.in.HandleWebhookUseCase;
import com.gym.payment.domain.port.in.WebhookCommand;
import com.gym.payment.domain.port.out.VerifiedWebhook;
import com.gym.payment.domain.port.out.WebhookVerifierPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/payments")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final HandleWebhookUseCase handleWebhookUseCase;
    private final WebhookVerifierPort webhookVerifierPort;

    public WebhookController(HandleWebhookUseCase handleWebhookUseCase,
                             WebhookVerifierPort webhookVerifierPort) {
        this.handleWebhookUseCase = handleWebhookUseCase;
        this.webhookVerifierPort = webhookVerifierPort;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        VerifiedWebhook webhook;
        try {
            webhook = webhookVerifierPort.verify(payload, sigHeader);
        } catch (WebhookSignatureException e) {
            log.warn("Invalid webhook signature: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if (webhook.paymentIntentId() == null) {
            log.warn("Webhook event {} could not be mapped to a supported payment intent, ignoring", webhook.eventId());
            return ResponseEntity.ok().build();
        }

        WebhookCommand command = new WebhookCommand(
                webhook.eventId(),
                webhook.paymentIntentId(),
                webhook.eventType(),
                webhook.failureReason()
        );

        try {
            handleWebhookUseCase.execute(command);
        } catch (Exception e) {
            log.error("Webhook processing failed for event {}: {}", webhook.eventId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok().build();
    }
}
