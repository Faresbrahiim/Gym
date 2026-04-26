package com.gym.payment.adapter.out.persistence;

import com.gym.payment.domain.exception.ConcurrentPaymentUpdateException;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.port.in.GetAllPaymentsQuery;
import com.gym.payment.domain.port.in.PagedResult;
import com.gym.payment.domain.port.out.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;
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
            PaymentJpaEntity entity = repository.findById(payment.getId())
                    .map(existing -> {
                        existing.setUserId(payment.getUserId());
                        existing.setTargetType(payment.getTargetType());
                        existing.setSubscriptionId(payment.getSubscriptionId());
                        existing.setPlanId(payment.getPlanId());
                        existing.setOrderId(payment.getOrderId());
                        existing.setAmount(payment.getAmount().amount());
                        existing.setCurrency(payment.getAmount().currency());
                        existing.setStatus(payment.getStatus());
                        existing.setStripePaymentIntentId(payment.getStripePaymentIntentId());
                        existing.setFailureReason(payment.getFailureReason());
                        existing.setCreatedAt(payment.getCreatedAt());
                        existing.setCompletedAt(payment.getCompletedAt());
                        return existing;
                    })
                    .orElseGet(() -> mapper.toEntity(payment));
            return mapper.toDomain(repository.save(entity));
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ConcurrentPaymentUpdateException("Payment " + payment.getId() + " was updated concurrently", e);
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
    public PagedResult<Payment> findPage(GetAllPaymentsQuery query, int page, int pageSize) {
        Pageable pageable = PageRequest.of(
                Math.max(page - 1, 0),
                Math.max(pageSize, 1),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<PaymentJpaEntity> result = repository.findAll(buildSpecification(query), pageable);

        return new PagedResult<>(
                result.getContent().stream().map(mapper::toDomain).toList(),
                page,
                pageSize,
                result.getTotalElements()
        );
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

    @Override
    public List<Payment> findByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime cutoff) {
        return repository.findByStatusAndCreatedAtBefore(status, cutoff)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    private Specification<PaymentJpaEntity> buildSpecification(GetAllPaymentsQuery query) {
        Specification<PaymentJpaEntity> spec = (root, q, cb) -> cb.conjunction();

        if (query.userId() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("userId"), query.userId()));
        }
        if (query.status() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), query.status()));
        }
        if (query.targetType() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("targetType"), query.targetType()));
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
