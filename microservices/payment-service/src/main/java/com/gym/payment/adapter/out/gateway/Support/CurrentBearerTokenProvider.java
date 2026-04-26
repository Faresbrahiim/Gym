package com.gym.payment.adapter.out.gateway.Support;

import com.gym.payment.domain.exception.PaymentGatewayException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class CurrentBearerTokenProvider {

    public String currentBearerToken() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            return jwt.getToken().getTokenValue();
        }

        throw new PaymentGatewayException("No JWT in security context for outbound payment lookup");
    }
}
