package com.gym.payment.adapter.in.web;

import com.gym.payment.domain.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice(assignableTypes = {
        PaymentController.class,
        AdminPaymentController.class,
        InternalPaymentController.class
})
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(PaymentNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, "Not Found", e.getMessage());
    }

    @ExceptionHandler(PaymentAlreadyProcessedException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyProcessed(PaymentAlreadyProcessedException e) {
        return build(HttpStatus.CONFLICT, "Conflict", e.getMessage());
    }

    @ExceptionHandler(InvalidPaymentStateException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidState(InvalidPaymentStateException e) {
        return build(HttpStatus.BAD_REQUEST, "Bad Request", e.getMessage());
    }

    @ExceptionHandler(PaymentGatewayException.class)
    public ResponseEntity<Map<String, Object>> handleGateway(PaymentGatewayException e) {
        return build(HttpStatus.BAD_GATEWAY, "Bad Gateway", "Payment gateway unavailable");
    }

    @ExceptionHandler(WebhookSignatureException.class)
    public ResponseEntity<Map<String, Object>> handleWebhookSignature(WebhookSignatureException e) {
        return build(HttpStatus.BAD_REQUEST, "Bad Request", "Invalid webhook signature");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce("", (a, b) -> a.isEmpty() ? b : a + ", " + b);
        return build(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
