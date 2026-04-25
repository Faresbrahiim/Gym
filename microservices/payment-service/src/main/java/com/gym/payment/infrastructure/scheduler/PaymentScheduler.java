package com.gym.payment.infrastructure.scheduler;

import com.gym.payment.domain.event.PaymentExpiredEvent;
import com.gym.payment.domain.event.OrderPaymentExpiredEvent;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.out.EventPublisherPort;
import com.gym.payment.domain.port.out.PaymentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PaymentScheduler {

    private final PaymentRepository paymentRepository;
    private final EventPublisherPort eventPublisherPort;
    private final long pendingPaymentTimeoutMinutes;

    public PaymentScheduler(
            PaymentRepository paymentRepository,
            EventPublisherPort eventPublisherPort,
            @org.springframework.beans.factory.annotation.Value("${payment.pending-timeout-minutes:2}") long pendingPaymentTimeoutMinutes
    ) {
        this.paymentRepository = paymentRepository;
        this.eventPublisherPort = eventPublisherPort;
        this.pendingPaymentTimeoutMinutes = pendingPaymentTimeoutMinutes;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePendingPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pendingPaymentTimeoutMinutes);
        List<Payment> stalePayments = paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff);

        for (Payment payment : stalePayments) {
            String reason = "Payment attempt expired after " + pendingPaymentTimeoutMinutes + " minutes";
            payment.markFailed(reason);
            paymentRepository.save(payment);
            if (payment.getTargetType() == PaymentTargetType.ORDER) {
                eventPublisherPort.publish("order-payment.expired", new OrderPaymentExpiredEvent(
                        payment.getId(),
                        payment.getOrderId(),
                        payment.getUserId(),
                        reason
                ));
            } else {
                eventPublisherPort.publish("payment.expired", new PaymentExpiredEvent(
                        payment.getId(),
                        payment.getSubscriptionId(),
                        payment.getUserId(),
                        reason
                ));
            }
        }
    }
}
