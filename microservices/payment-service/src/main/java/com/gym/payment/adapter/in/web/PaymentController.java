package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.in.web.dto.InitiatePaymentRequest;
import com.gym.payment.adapter.in.web.dto.InitiateOrderPaymentRequest;
import com.gym.payment.adapter.in.web.dto.InitiatePaymentResponse;
import com.gym.payment.adapter.in.web.dto.PagedResponse;
import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.in.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final InitiatePaymentUseCase initiatePaymentUseCase;
    private final InitiateOrderPaymentUseCase initiateOrderPaymentUseCase;
    private final GetMyPaymentHistoryUseCase getMyPaymentHistoryUseCase;
    private final GetMyPaymentByIdUseCase getMyPaymentByIdUseCase;

    public PaymentController(InitiatePaymentUseCase initiatePaymentUseCase,
                             InitiateOrderPaymentUseCase initiateOrderPaymentUseCase,
                             GetMyPaymentHistoryUseCase getMyPaymentHistoryUseCase,
                             GetMyPaymentByIdUseCase getMyPaymentByIdUseCase) {
        this.initiatePaymentUseCase = initiatePaymentUseCase;
        this.initiateOrderPaymentUseCase = initiateOrderPaymentUseCase;
        this.getMyPaymentHistoryUseCase = getMyPaymentHistoryUseCase;
        this.getMyPaymentByIdUseCase = getMyPaymentByIdUseCase;
    }

    @PostMapping("/initiate")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            JwtAuthenticationToken token) {
        ensureMemberAccess(token);

        UUID userId = UUID.fromString(token.getToken().getSubject());

        InitiatePaymentCommand command = new InitiatePaymentCommand(
                userId,
                request.subscriptionId(),
                request.planId(),
                request.paymentMethodToken()
        );

        com.gym.payment.domain.port.in.InitiatePaymentResponse result = initiatePaymentUseCase.execute(command);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new InitiatePaymentResponse(result.paymentId(), result.clientSecret()));
    }

    @PostMapping("/initiate-order")
    public ResponseEntity<InitiatePaymentResponse> initiateOrderPayment(
            @Valid @RequestBody InitiateOrderPaymentRequest request,
            JwtAuthenticationToken token) {

        UUID userId = UUID.fromString(token.getToken().getSubject());

        InitiatePaymentResponse result = toWebResponse(
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
        UUID userId = UUID.fromString(token.getToken().getSubject());
        PaymentTargetType effectiveTargetType = resolveAccessibleTargetType(token, targetType);

        PagedResult<com.gym.payment.domain.port.in.PaymentResponse> result =
                getMyPaymentHistoryUseCase.execute(userId, status, effectiveTargetType, page, pageSize);

        List<PaymentResponse> responses = result.items()
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(PagedResponse.of(
                responses,
                result.page(),
                result.pageSize(),
                result.totalItems()
        ));
    }

    @GetMapping("/me/{paymentId}")
    public ResponseEntity<PaymentResponse> getMyPaymentById(
            @PathVariable UUID paymentId,
            JwtAuthenticationToken token) {
        UUID userId = UUID.fromString(token.getToken().getSubject());

        return getMyPaymentByIdUseCase.execute(userId, paymentId)
                .filter(payment -> isMember(token) || payment.targetType() != PaymentTargetType.MEMBERSHIP)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void ensureMemberAccess(JwtAuthenticationToken token) {
        if (!isMember(token)) {
            throw new AccessDeniedException("Membership payments are available to members only");
        }
    }

    private PaymentTargetType resolveAccessibleTargetType(JwtAuthenticationToken token, PaymentTargetType targetType) {
        if (isMember(token)) {
            return targetType;
        }

        if (targetType == PaymentTargetType.MEMBERSHIP) {
            throw new AccessDeniedException("Membership payment history is available to members only");
        }

        return PaymentTargetType.ORDER;
    }

    private boolean isMember(JwtAuthenticationToken token) {
        return "MEMBER".equalsIgnoreCase(token.getToken().getClaimAsString("role"));
    }

    private PaymentResponse toDto(com.gym.payment.domain.port.in.PaymentResponse r) {
        return new PaymentResponse(
                r.id(), r.userId(), r.targetType(), r.subscriptionId(), r.planId(), r.orderId(),
                r.amount(), r.currency(), r.status(),
                r.stripePaymentIntentId(), r.failureReason(),
                r.createdAt(), r.completedAt()
        );
    }

    private InitiatePaymentResponse toWebResponse(com.gym.payment.domain.port.in.InitiatePaymentResponse response) {
        return new InitiatePaymentResponse(response.paymentId(), response.clientSecret());
    }
}
