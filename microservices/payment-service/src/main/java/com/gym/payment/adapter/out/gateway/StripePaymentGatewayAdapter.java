package com.gym.payment.adapter.out.gateway;

import com.gym.payment.domain.exception.PaymentGatewayException;
import com.gym.payment.domain.model.Money;
import com.gym.payment.domain.port.out.GatewayResult;
import com.gym.payment.domain.port.out.PaymentGatewayPort;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class StripePaymentGatewayAdapter implements PaymentGatewayPort {

    private final String apiKey;

    public StripePaymentGatewayAdapter(@org.springframework.beans.factory.annotation.Value("${stripe.api-key}") String apiKey) {
        this.apiKey = apiKey;
    }

    @Override
    public GatewayResult createPaymentIntent(Money money, String paymentMethodToken) {
        try {
            com.stripe.Stripe.apiKey = apiKey;

            long amountInCents = toStripeAmount(money);

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(money.currency().toLowerCase())
                    .setPaymentMethod(paymentMethodToken)
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            return new GatewayResult(intent.getId(), intent.getClientSecret());

        } catch (StripeException e) {
            throw new PaymentGatewayException("Stripe error: " + e.getMessage());
        } catch (ArithmeticException e) {
            throw new PaymentGatewayException("Unsupported payment amount precision for Stripe");
        }
    }

    private long toStripeAmount(Money money) {
        return money.amount()
                .multiply(BigDecimal.valueOf(100))
                .longValueExact();
    }
}
