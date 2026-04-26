package com.gym.payment.adapter.in.web.security;

import com.gym.payment.domain.model.PaymentTargetType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PaymentAccessPolicy {

    public UUID currentUserId(JwtAuthenticationToken token) {
        return UUID.fromString(token.getToken().getSubject());
    }

    public PaymentTargetType resolveHistoryTargetType(JwtAuthenticationToken token, PaymentTargetType requestedTargetType) {
        if (isMember(token)) {
            return requestedTargetType;
        }

        if (requestedTargetType == PaymentTargetType.MEMBERSHIP) {
            throw new AccessDeniedException("Membership payment history is available to members only");
        }

        return PaymentTargetType.ORDER;
    }

    public boolean canAccessPayment(JwtAuthenticationToken token, com.gym.payment.domain.port.in.PaymentResponse payment) {
        return isMember(token) || payment.targetType() != PaymentTargetType.MEMBERSHIP;
    }

    private boolean isMember(JwtAuthenticationToken token) {
        return token.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_MEMBER"::equals);
    }
}
