package com.gym.payment.adapter.out.persistence;

import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.port.in.GetAllPaymentsQuery;
import com.gym.payment.domain.port.out.PaymentRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PaymentPersistenceAdapter implements PaymentRepository {

    private final SpringDataPaymentRepository repository;
    private final PaymentEntityMapper mapper;

    public PaymentPersistenceAdapter(SpringDataPaymentRepository repository, PaymentEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Payment save(Payment payment) {
        try {
            PaymentJpaEntity entity = mapper.toEntity(payment);
            return mapper.toDomain(repository.save(entity));
        } catch (ObjectOptimisticLockingFailureException e) {
            return payment;
        }
    }

    @Override
    public Optional<Payment> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId) {
        return repository.findByStripePaymentIntentId(stripePaymentIntentId).map(mapper::toDomain);
    }

    @Override
    public List<Payment> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<Payment> findAll(GetAllPaymentsQuery query) {
        return repository.findAll(buildSpecification(query))
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Payment> findLatestBySubscriptionId(UUID subscriptionId) {
        return repository.findTopBySubscriptionIdOrderByCreatedAtDesc(subscriptionId).map(mapper::toDomain);
    }

    private Specification<PaymentJpaEntity> buildSpecification(GetAllPaymentsQuery query) {
        Specification<PaymentJpaEntity> spec = Specification.where(
                (Specification<PaymentJpaEntity>) null
        );

        if (query.userId() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("userId"), query.userId()));
        }
        if (query.status() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), query.status()));
        }
        if (query.from() != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), query.from().atStartOfDay()));
        }
        if (query.to() != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), query.to().atTime(23, 59, 59)));
        }

        return spec;
    }
}
