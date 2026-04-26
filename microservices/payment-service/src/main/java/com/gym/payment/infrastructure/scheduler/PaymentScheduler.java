package com.gym.payment.infrastructure.scheduler;

import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.port.in.ExpirePendingPaymentUseCase;
import com.gym.payment.domain.port.out.PaymentRepository;
import com.gym.payment.infrastructure.config.PaymentProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PaymentScheduler {

    private final PaymentRepository paymentRepository;
    private final ExpirePendingPaymentUseCase expirePendingPaymentUseCase;
    private final long pendingPaymentTimeoutMinutes;

    public PaymentScheduler(
            PaymentRepository paymentRepository,
            ExpirePendingPaymentUseCase expirePendingPaymentUseCase,
            PaymentProperties paymentProperties
    ) {
        this.paymentRepository = paymentRepository;
        this.expirePendingPaymentUseCase = expirePendingPaymentUseCase;
        this.pendingPaymentTimeoutMinutes = paymentProperties.getPendingTimeoutMinutes();
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePendingPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pendingPaymentTimeoutMinutes);
        List<Payment> stalePayments = paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff);

        for (Payment payment : stalePayments) {
            String reason = "Payment attempt expired after " + pendingPaymentTimeoutMinutes + " minutes";
            expirePendingPaymentUseCase.expirePendingPayment(payment, reason);
        }
    }
}
