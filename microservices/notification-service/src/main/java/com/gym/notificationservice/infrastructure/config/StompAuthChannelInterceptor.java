package com.gym.notificationservice.infrastructure.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    public StompAuthChannelInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }
        List<String> authz = accessor.getNativeHeader("Authorization");
        if (authz == null || authz.isEmpty()) {
            throw new IllegalArgumentException("Missing Authorization header on STOMP CONNECT");
        }
        String header = authz.get(0);
        if (!header.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid Authorization scheme on STOMP CONNECT");
        }
        Jwt jwt = jwtDecoder.decode(header.substring(7));
        String userId = jwt.getSubject();
        accessor.setUser((Principal) () -> userId);
        return message;
    }
}
