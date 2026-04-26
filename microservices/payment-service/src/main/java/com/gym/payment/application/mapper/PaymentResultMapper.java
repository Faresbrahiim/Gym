package com.gym.payment.application.mapper;

import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.port.in.PaymentResponse;
import org.springframework.stereotype.Component;

@Component
public class PaymentResultMapper {

    public PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getUserId(),
                payment.getTargetType(),
                payment.getSubscriptionId(),
                payment.getPlanId(),
                payment.getOrderId(),
                payment.getAmount().amount(),
                payment.getAmount().currency(),
                payment.getStatus(),
                payment.getStripePaymentIntentId(),
                payment.getFailureReason(),
                payment.getCreatedAt(),
                payment.getCompletedAt()
        );
    }
}
