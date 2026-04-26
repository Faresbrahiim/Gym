package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.in.web.mapper.PaymentWebMapper;
import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.domain.port.in.GetLatestSubscriptionPaymentUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/payments")
public class InternalPaymentController {

    private final GetLatestSubscriptionPaymentUseCase getLatestSubscriptionPaymentUseCase;
    private final PaymentWebMapper paymentWebMapper;

    public InternalPaymentController(GetLatestSubscriptionPaymentUseCase getLatestSubscriptionPaymentUseCase,
                                     PaymentWebMapper paymentWebMapper) {
        this.getLatestSubscriptionPaymentUseCase = getLatestSubscriptionPaymentUseCase;
        this.paymentWebMapper = paymentWebMapper;
    }

    @GetMapping("/{subscriptionId}/latest")
    public ResponseEntity<PaymentResponse> getLatestPayment(@PathVariable UUID subscriptionId) {
        return getLatestSubscriptionPaymentUseCase.executeForSubscription(subscriptionId)
                .map(paymentWebMapper::toPaymentResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
