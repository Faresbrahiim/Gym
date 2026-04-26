package com.gym.payment.adapter.out.gateway;

import com.gym.payment.domain.exception.InvalidPaymentStateException;
import com.gym.payment.domain.exception.PaymentGatewayException;
import com.gym.payment.domain.port.out.PlanGatewayPort;
import com.gym.payment.domain.port.out.PlanPricing;
import com.gym.payment.domain.port.out.SubscriptionGatewayPort;
import com.gym.payment.adapter.out.gateway.Support.CurrentBearerTokenProvider;
import com.gym.payment.infrastructure.config.PaymentProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class MembershipPlanClient implements PlanGatewayPort, SubscriptionGatewayPort {

    private static final Logger log = LoggerFactory.getLogger(MembershipPlanClient.class);

    private final RestClient restClient;
    private final String defaultCurrency;
    private final CurrentBearerTokenProvider bearerTokenProvider;

    public MembershipPlanClient(@Value("${membership-service.base-url}") String baseUrl,
                                PaymentProperties paymentProperties,
                                CurrentBearerTokenProvider bearerTokenProvider) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.defaultCurrency = paymentProperties.getDefaultCurrency();
        this.bearerTokenProvider = bearerTokenProvider;
    }

    @Override
    public PlanPricing getPlanPricing(UUID planId) {
        try {
            PlanResponse plan = restClient.get()
                    .uri("/api/plans/{planId}", planId)
                    .header("Authorization", "Bearer " + bearerTokenProvider.currentBearerToken())
                    .retrieve()
                    .body(PlanResponse.class);

            if (plan == null || plan.price() == null) {
                throw new PaymentGatewayException("Plan " + planId + " returned no pricing");
            }

            return new PlanPricing(BigDecimal.valueOf(plan.price()), defaultCurrency);
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch plan {} from membership-service: {}", planId, e.getMessage());
            throw new PaymentGatewayException("Plan pricing lookup failed: " + e.getMessage());
        }
    }

    @Override
    public void ensureOwnedByUser(UUID userId, UUID subscriptionId) {
        try {
            SubscriptionResponse subscription = restClient.get()
                    .uri("/api/subscriptions/me/{subscriptionId}", subscriptionId)
                    .header("Authorization", "Bearer " + bearerTokenProvider.currentBearerToken())
                    .retrieve()
                    .body(SubscriptionResponse.class);

            if (subscription == null || !userId.equals(subscription.userId())) {
                throw new InvalidPaymentStateException("Subscription does not belong to the current user");
            }
        } catch (InvalidPaymentStateException e) {
            throw e;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                throw new InvalidPaymentStateException("Subscription does not belong to the current user");
            }
            log.error("Failed to validate subscription {} ownership: {}", subscriptionId, e.getMessage());
            throw new PaymentGatewayException("Subscription validation failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to validate subscription {} ownership: {}", subscriptionId, e.getMessage());
            throw new PaymentGatewayException("Subscription validation failed: " + e.getMessage());
        }
    }

    private record PlanResponse(
            UUID id,
            String name,
            String description,
            Double price,
            Integer durationInDays,
            String status
    ) {}

    private record SubscriptionResponse(
            UUID subscriptionId,
            UUID userId
    ) {}
}
