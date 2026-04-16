package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.in.web.dto.InitiatePaymentRequest;
import com.gym.payment.adapter.in.web.dto.InitiatePaymentResponse;
import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.domain.port.in.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final InitiatePaymentUseCase initiatePaymentUseCase;
    private final GetMyPaymentHistoryUseCase getMyPaymentHistoryUseCase;

    public PaymentController(InitiatePaymentUseCase initiatePaymentUseCase,
                             GetMyPaymentHistoryUseCase getMyPaymentHistoryUseCase) {
        this.initiatePaymentUseCase = initiatePaymentUseCase;
        this.getMyPaymentHistoryUseCase = getMyPaymentHistoryUseCase;
    }

    @PostMapping("/initiate")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            JwtAuthenticationToken token) {

        UUID userId = UUID.fromString(token.getToken().getSubject());

        InitiatePaymentCommand command = new InitiatePaymentCommand(
                userId,
                request.subscriptionId(),
                request.planId(),
                request.amount(),
                request.currency(),
                request.paymentMethodToken()
        );

        com.gym.payment.domain.port.in.InitiatePaymentResponse result = initiatePaymentUseCase.execute(command);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new InitiatePaymentResponse(result.paymentId(), result.clientSecret()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(JwtAuthenticationToken token) {
        UUID userId = UUID.fromString(token.getToken().getSubject());

        List<PaymentResponse> responses = getMyPaymentHistoryUseCase.execute(userId)
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(responses);
    }

    private PaymentResponse toDto(com.gym.payment.domain.port.in.PaymentResponse r) {
        return new PaymentResponse(
                r.id(), r.userId(), r.subscriptionId(), r.planId(),
                r.amount(), r.currency(), r.status(),
                r.stripePaymentIntentId(), r.failureReason(),
                r.createdAt(), r.completedAt()
        );
    }
}
