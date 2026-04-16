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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

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

        try {
            Event event = StripePaymentGatewayAdapter.verifyWebhookSignature(
                    payload, sigHeader, stripeAdapter.getWebhookSecret()
            );

            Optional<StripeObject> stripeObjectOpt = event.getDataObjectDeserializer().getObject();
            if (stripeObjectOpt.isEmpty()) {
                return ResponseEntity.ok().build();
            }

            PaymentIntent intent = (PaymentIntent) stripeObjectOpt.get();
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

            handleWebhookUseCase.execute(command);

        } catch (WebhookSignatureException e) {
            log.error("Invalid webhook signature: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Webhook processing error: {}", e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
}
