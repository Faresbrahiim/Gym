package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.in.web.mapper.PaymentWebMapper;
import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.in.GetAllPaymentsQuery;
import com.gym.payment.domain.port.in.GetAllPaymentsUseCase;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final GetAllPaymentsUseCase getAllPaymentsUseCase;
    private final PaymentWebMapper paymentWebMapper;

    public AdminPaymentController(GetAllPaymentsUseCase getAllPaymentsUseCase,
                                  PaymentWebMapper paymentWebMapper) {
        this.getAllPaymentsUseCase = getAllPaymentsUseCase;
        this.paymentWebMapper = paymentWebMapper;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentTargetType targetType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        GetAllPaymentsQuery query = new GetAllPaymentsQuery(userId, status, targetType, from, to);

        List<PaymentResponse> responses = paymentWebMapper.toPaymentResponses(getAllPaymentsUseCase.execute(query));

        return ResponseEntity.ok(responses);
    }
}
