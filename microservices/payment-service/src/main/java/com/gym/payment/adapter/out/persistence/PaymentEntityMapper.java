package com.gym.payment.adapter.out.persistence;

import com.gym.payment.domain.model.Money;
import com.gym.payment.domain.model.Payment;
import org.springframework.stereotype.Component;

@Component
class PaymentEntityMapper {

    PaymentJpaEntity toEntity(Payment payment) {
        PaymentJpaEntity entity = new PaymentJpaEntity();
        entity.setId(payment.getId());
        entity.setUserId(payment.getUserId());
        entity.setSubscriptionId(payment.getSubscriptionId());
        entity.setPlanId(payment.getPlanId());
        entity.setAmount(payment.getAmount().amount());
        entity.setCurrency(payment.getAmount().currency());
        entity.setStatus(payment.getStatus());
        entity.setStripePaymentIntentId(payment.getStripePaymentIntentId());
        entity.setFailureReason(payment.getFailureReason());
        entity.setCreatedAt(payment.getCreatedAt());
        entity.setCompletedAt(payment.getCompletedAt());
        return entity;
    }

    Payment toDomain(PaymentJpaEntity entity) {
        return new Payment(
                entity.getId(),
                entity.getUserId(),
                entity.getSubscriptionId(),
                entity.getPlanId(),
                new Money(entity.getAmount(), entity.getCurrency()),
                entity.getStatus(),
                entity.getStripePaymentIntentId(),
                entity.getFailureReason(),
                entity.getCreatedAt(),
                entity.getCompletedAt()
        );
    }
}
