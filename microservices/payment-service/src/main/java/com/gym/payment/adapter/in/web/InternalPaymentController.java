package com.gym.payment.adapter.in.web;

import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.domain.port.in.GetLatestSubscriptionPaymentUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/payments")
public class InternalPaymentController {

    private final GetLatestSubscriptionPaymentUseCase getLatestSubscriptionPaymentUseCase;

    public InternalPaymentController(GetLatestSubscriptionPaymentUseCase getLatestSubscriptionPaymentUseCase) {
        this.getLatestSubscriptionPaymentUseCase = getLatestSubscriptionPaymentUseCase;
    }

    @GetMapping("/{subscriptionId}/latest")
    public ResponseEntity<PaymentResponse> getLatestPayment(@PathVariable UUID subscriptionId) {
        return getLatestSubscriptionPaymentUseCase.executeForSubscription(subscriptionId)
                .map(r -> ResponseEntity.ok(new PaymentResponse(
                        r.id(), r.userId(), r.targetType(), r.subscriptionId(), r.planId(), r.orderId(),
                        r.amount(), r.currency(), r.status(),
                        r.stripePaymentIntentId(), r.failureReason(),
                        r.createdAt(), r.completedAt()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
