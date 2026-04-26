package com.gym.payment.adapter.out.gateway;

import com.gym.payment.domain.exception.WebhookSignatureException;
import com.gym.payment.domain.model.WebhookEventType;
import com.gym.payment.domain.port.out.VerifiedWebhook;
import com.gym.payment.domain.port.out.WebhookVerifierPort;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StripeWebhookVerifier implements WebhookVerifierPort {

    private final String webhookSecret;

    public StripeWebhookVerifier(@Value("${stripe.webhook-secret}") String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    @Override
    public VerifiedWebhook verify(String payload, String signatureHeader) {
        Event event = verifySignature(payload, signatureHeader);
        StripeObject stripeObject = deserializePaymentIntent(event);
        if (!(stripeObject instanceof PaymentIntent intent)) {
            return new VerifiedWebhook(
                    event.getId(),
                    null,
                    WebhookEventType.UNSUPPORTED,
                    null
            );
        }
        String failureReason = intent.getLastPaymentError() != null
                ? intent.getLastPaymentError().getMessage()
                : null;

        return new VerifiedWebhook(
                event.getId(),
                intent.getId(),
                WebhookEventType.fromStripeType(event.getType()),
                failureReason
        );
    }

    private Event verifySignature(String payload, String signatureHeader) {
        try {
            return Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new WebhookSignatureException("Invalid webhook signature");
        }
    }

    private StripeObject deserializePaymentIntent(Event event) {
        try {
            return event.getDataObjectDeserializer().deserializeUnsafe();
        } catch (Exception ignored) {
            return null;
        }
    }
}
