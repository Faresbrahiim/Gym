package com.gym.membershipservice.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;

import java.security.interfaces.RSAPublicKey;
import java.util.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // Load public key from application.yml
    @Value("${jwt.public-key}")
    private RSAPublicKey publicKey;

    // =========================
    //  MAIN SECURITY FILTER
    // =========================
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        // Swagger (public)
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/webjars/**"
                        ).permitAll()

                        .requestMatchers("/api/plans/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/plans/**").permitAll()

                        // everything else needs auth
                        .anyRequest().authenticated()
                )

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(this::extractAuthorities);

        return converter;
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        //  ROLE
        String role = jwt.getClaimAsString("role");
        if (role != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }

        // PERMISSIONS
        List<String> permissions = jwt.getClaimAsStringList("permission");
        if (permissions != null) {
            permissions.forEach(p ->
                    authorities.add(new SimpleGrantedAuthority(p))
            );
        }

        System.out.println("JWT CLAIMS: " + jwt.getClaims());
        System.out.println("AUTHORITIES: " + authorities);

        return authorities;
    }
}
