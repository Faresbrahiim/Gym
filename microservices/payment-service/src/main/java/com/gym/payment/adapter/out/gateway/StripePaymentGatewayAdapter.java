package com.gym.payment.adapter.out.gateway;

import com.gym.payment.domain.exception.PaymentGatewayException;
import com.gym.payment.domain.exception.WebhookSignatureException;
import com.gym.payment.domain.model.Money;
import com.gym.payment.domain.port.out.GatewayResult;
import com.gym.payment.domain.port.out.PaymentGatewayPort;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StripePaymentGatewayAdapter implements PaymentGatewayPort {

    @Value("${stripe.api-key}")
    private String apiKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Override
    public GatewayResult createPaymentIntent(Money money, String paymentMethodToken) {
        try {
            com.stripe.Stripe.apiKey = apiKey;

            long amountInCents = money.amount()
                    .multiply(java.math.BigDecimal.valueOf(100))
                    .longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(money.currency().toLowerCase())
                    .setPaymentMethod(paymentMethodToken)
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            return new GatewayResult(intent.getId(), intent.getClientSecret());

        } catch (StripeException e) {
            throw new PaymentGatewayException("Stripe error: " + e.getMessage());
        }
    }

    public static Event verifyWebhookSignature(String payload, String sigHeader, String secret) {
        try {
            return Webhook.constructEvent(payload, sigHeader, secret);
        } catch (SignatureVerificationException e) {
            throw new WebhookSignatureException("Invalid webhook signature");
        }
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }
}
