package com.gym.payment.domain.port.out;

import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.port.in.GetAllPaymentsQuery;
import com.gym.payment.domain.port.in.PagedResult;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository {
    Payment save(Payment payment);
    Optional<Payment> findById(UUID id);
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
    List<Payment> findByUserId(UUID userId);
    PagedResult<Payment> findPage(GetAllPaymentsQuery query, int page, int pageSize);
    List<Payment> findAll(GetAllPaymentsQuery query);
    Optional<Payment> findLatestBySubscriptionId(UUID subscriptionId);
}
