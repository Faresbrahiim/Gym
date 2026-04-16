package com.gym.payment.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface SpringDataPaymentRepository extends JpaRepository<PaymentJpaEntity, UUID>,
        JpaSpecificationExecutor<PaymentJpaEntity> {

    Optional<PaymentJpaEntity> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<PaymentJpaEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<PaymentJpaEntity> findTopBySubscriptionIdOrderByCreatedAtDesc(UUID subscriptionId);
}
