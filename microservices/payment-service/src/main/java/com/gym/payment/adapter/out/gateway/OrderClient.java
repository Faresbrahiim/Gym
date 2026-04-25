package com.gym.payment.adapter.out.gateway;

import com.gym.payment.domain.exception.InvalidPaymentStateException;
import com.gym.payment.domain.exception.PaymentGatewayException;
import com.gym.payment.domain.port.out.OrderGatewayPort;
import com.gym.payment.domain.port.out.OrderPaymentDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class OrderClient implements OrderGatewayPort {

    private static final Logger log = LoggerFactory.getLogger(OrderClient.class);
    private static final String DEFAULT_CURRENCY = "USD";

    private final RestClient restClient;

    public OrderClient(@Value("${cart-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    @Override
    public OrderPaymentDetails getOrderPaymentDetails(UUID userId, UUID orderId) {
        try {
            OrderPaymentResponse order = restClient.get()
                    .uri("/internal/orders/{orderId}/payment-details", orderId)
                    .header("Authorization", "Bearer " + currentBearerToken())
                    .retrieve()
                    .body(OrderPaymentResponse.class);

            if (order == null || order.totalAmount() == null) {
                throw new PaymentGatewayException("Order " + orderId + " returned no payment details");
            }

            if (!userId.equals(order.userId())) {
                throw new InvalidPaymentStateException("Order does not belong to the current user");
            }

            return new OrderPaymentDetails(
                    order.orderId(),
                    order.totalAmount(),
                    order.currency() == null || order.currency().isBlank() ? DEFAULT_CURRENCY : order.currency()
            );
        } catch (InvalidPaymentStateException e) {
            throw e;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                throw new InvalidPaymentStateException("Order is not available for payment");
            }
            log.error("Failed to fetch order {} payment details: {}", orderId, e.getMessage());
            throw new PaymentGatewayException("Order payment lookup failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to fetch order {} payment details: {}", orderId, e.getMessage());
            throw new PaymentGatewayException("Order payment lookup failed: " + e.getMessage());
        }
    }

    private String currentBearerToken() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            return jwt.getToken().getTokenValue();
        }
        throw new PaymentGatewayException("No JWT in security context for order lookup");
    }

    private record OrderPaymentResponse(
            UUID orderId,
            UUID userId,
            BigDecimal totalAmount,
            String currency
    ) {}
}
