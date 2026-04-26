package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.in.web.dto.InitiatePaymentRequest;
import com.gym.payment.adapter.in.web.dto.InitiateOrderPaymentRequest;
import com.gym.payment.adapter.in.web.dto.InitiatePaymentResponse;
import com.gym.payment.adapter.in.web.dto.PagedResponse;
import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.adapter.in.web.mapper.PaymentWebMapper;
import com.gym.payment.adapter.in.web.security.PaymentAccessPolicy;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.in.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final InitiatePaymentUseCase initiatePaymentUseCase;
    private final InitiateOrderPaymentUseCase initiateOrderPaymentUseCase;
    private final GetMyPaymentHistoryUseCase getMyPaymentHistoryUseCase;
    private final GetMyPaymentByIdUseCase getMyPaymentByIdUseCase;
    private final PaymentAccessPolicy paymentAccessPolicy;
    private final PaymentWebMapper paymentWebMapper;

    public PaymentController(InitiatePaymentUseCase initiatePaymentUseCase,
                             InitiateOrderPaymentUseCase initiateOrderPaymentUseCase,
                             GetMyPaymentHistoryUseCase getMyPaymentHistoryUseCase,
                             GetMyPaymentByIdUseCase getMyPaymentByIdUseCase,
                             PaymentAccessPolicy paymentAccessPolicy,
                             PaymentWebMapper paymentWebMapper) {
        this.initiatePaymentUseCase = initiatePaymentUseCase;
        this.initiateOrderPaymentUseCase = initiateOrderPaymentUseCase;
        this.getMyPaymentHistoryUseCase = getMyPaymentHistoryUseCase;
        this.getMyPaymentByIdUseCase = getMyPaymentByIdUseCase;
        this.paymentAccessPolicy = paymentAccessPolicy;
        this.paymentWebMapper = paymentWebMapper;
    }

    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/initiate")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            JwtAuthenticationToken token) {
        UUID userId = paymentAccessPolicy.currentUserId(token);

        InitiatePaymentCommand command = new InitiatePaymentCommand(
                userId,
                request.subscriptionId(),
                request.planId(),
                request.paymentMethodToken()
        );

        com.gym.payment.domain.port.in.InitiatePaymentResponse result = initiatePaymentUseCase.execute(command);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentWebMapper.toInitiateResponse(result));
    }

    @PostMapping("/initiate-order")
    public ResponseEntity<InitiatePaymentResponse> initiateOrderPayment(
            @Valid @RequestBody InitiateOrderPaymentRequest request,
            JwtAuthenticationToken token) {

        UUID userId = paymentAccessPolicy.currentUserId(token);

        InitiatePaymentResponse result =
                paymentWebMapper.toInitiateResponse(
                initiateOrderPaymentUseCase.execute(new InitiateOrderPaymentCommand(
                        userId,
                        request.orderId(),
                        request.paymentMethodToken()
                ))
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/me")
    public ResponseEntity<PagedResponse<PaymentResponse>> getMyPayments(
            JwtAuthenticationToken token,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentTargetType targetType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        UUID userId = paymentAccessPolicy.currentUserId(token);
        PaymentTargetType effectiveTargetType = paymentAccessPolicy.resolveHistoryTargetType(token, targetType);

        PagedResult<com.gym.payment.domain.port.in.PaymentResponse> result =
                getMyPaymentHistoryUseCase.execute(userId, status, effectiveTargetType, page, pageSize);

        return ResponseEntity.ok(paymentWebMapper.toPagedResponse(result));
    }

    @GetMapping("/me/{paymentId}")
    public ResponseEntity<PaymentResponse> getMyPaymentById(
            @PathVariable UUID paymentId,
            JwtAuthenticationToken token) {
        UUID userId = paymentAccessPolicy.currentUserId(token);

        return getMyPaymentByIdUseCase.execute(userId, paymentId)
                .filter(payment -> paymentAccessPolicy.canAccessPayment(token, payment))
                .map(paymentWebMapper::toPaymentResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
