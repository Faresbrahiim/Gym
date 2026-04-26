package com.gym.payment.application;

import com.gym.payment.application.mapper.PaymentResultMapper;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.in.GetAllPaymentsQuery;
import com.gym.payment.domain.port.in.GetAllPaymentsUseCase;
import com.gym.payment.domain.port.in.GetLatestSubscriptionPaymentUseCase;
import com.gym.payment.domain.port.in.GetMyPaymentByIdUseCase;
import com.gym.payment.domain.port.in.GetMyPaymentHistoryUseCase;
import com.gym.payment.domain.port.in.PagedResult;
import com.gym.payment.domain.port.in.PaymentResponse;
import com.gym.payment.domain.port.out.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PaymentQueryService implements
        GetMyPaymentHistoryUseCase,
        GetMyPaymentByIdUseCase,
        GetAllPaymentsUseCase,
        GetLatestSubscriptionPaymentUseCase {

    private final PaymentRepository paymentRepository;
    private final PaymentResultMapper paymentResultMapper;

    public PaymentQueryService(PaymentRepository paymentRepository,
                               PaymentResultMapper paymentResultMapper) {
        this.paymentRepository = paymentRepository;
        this.paymentResultMapper = paymentResultMapper;
    }

    @Override
    public PagedResult<PaymentResponse> execute(UUID userId, PaymentStatus status, PaymentTargetType targetType, int page, int pageSize) {
        PagedResult<Payment> pagedPayments = paymentRepository.findPage(
                new GetAllPaymentsQuery(userId, status, targetType, null, null),
                page,
                pageSize
        );

        return new PagedResult<>(
                pagedPayments.items().stream().map(paymentResultMapper::toResponse).toList(),
                pagedPayments.page(),
                pagedPayments.pageSize(),
                pagedPayments.totalItems()
        );
    }

    @Override
    public Optional<PaymentResponse> execute(UUID userId, UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .filter(payment -> payment.getUserId().equals(userId))
                .map(paymentResultMapper::toResponse);
    }

    @Override
    public List<PaymentResponse> execute(GetAllPaymentsQuery query) {
        return paymentRepository.findAll(query)
                .stream()
                .map(paymentResultMapper::toResponse)
                .toList();
    }

    @Override
    public Optional<PaymentResponse> executeForSubscription(UUID subscriptionId) {
        return paymentRepository.findLatestBySubscriptionId(subscriptionId)
                .map(paymentResultMapper::toResponse);
    }
}
