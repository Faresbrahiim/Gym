package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.out.gateway.StripePaymentGatewayAdapter;
import com.gym.payment.domain.exception.WebhookSignatureException;
import com.gym.payment.domain.port.in.HandleWebhookUseCase;
import com.gym.payment.domain.port.in.WebhookCommand;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
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
    private final StripePaymentGatewayAdapter stripeAdapter;

    public WebhookController(HandleWebhookUseCase handleWebhookUseCase,
                             StripePaymentGatewayAdapter stripeAdapter) {
        this.handleWebhookUseCase = handleWebhookUseCase;
        this.stripeAdapter = stripeAdapter;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            event = StripePaymentGatewayAdapter.verifyWebhookSignature(
                    payload, sigHeader, stripeAdapter.getWebhookSecret()
            );
        } catch (WebhookSignatureException e) {
            log.warn("Invalid webhook signature: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        StripeObject stripeObject;
        try {
            stripeObject = event.getDataObjectDeserializer().deserializeUnsafe();
        } catch (Exception e) {
            log.warn("Webhook event {} could not be deserialized (API version mismatch?): {}", event.getId(), e.getMessage());
            return ResponseEntity.ok().build();
        }

        if (!(stripeObject instanceof PaymentIntent)) {
            log.warn("Webhook event {} is not a PaymentIntent, ignoring", event.getId());
            return ResponseEntity.ok().build();
        }

        PaymentIntent intent = (PaymentIntent) stripeObject;
        String failureReason = intent.getLastPaymentError() != null
                ? intent.getLastPaymentError().getMessage()
                : null;

        WebhookCommand command = new WebhookCommand(
                event.getId(),
                intent.getId(),
                event.getType(),
                failureReason,
                payload,
                sigHeader
        );

        try {
            handleWebhookUseCase.execute(command);
        } catch (Exception e) {
            log.error("Webhook processing failed for event {}: {}", event.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok().build();
    }
}
