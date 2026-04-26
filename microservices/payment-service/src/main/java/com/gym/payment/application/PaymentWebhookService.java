package com.gym.payment.application;

import com.gym.payment.domain.event.OrderPaymentCompletedEvent;
import com.gym.payment.domain.event.OrderPaymentExpiredEvent;
import com.gym.payment.domain.event.OrderPaymentFailedEvent;
import com.gym.payment.domain.event.PaymentCompletedEvent;
import com.gym.payment.domain.event.PaymentExpiredEvent;
import com.gym.payment.domain.event.PaymentFailedEvent;
import com.gym.payment.domain.exception.PaymentNotFoundException;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.in.ExpirePendingPaymentUseCase;
import com.gym.payment.domain.port.in.HandleWebhookUseCase;
import com.gym.payment.domain.port.in.WebhookCommand;
import com.gym.payment.domain.port.out.EventPublisherPort;
import com.gym.payment.domain.port.out.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentWebhookService implements HandleWebhookUseCase, ExpirePendingPaymentUseCase {

    private final PaymentRepository paymentRepository;
    private final EventPublisherPort eventPublisherPort;

    public PaymentWebhookService(PaymentRepository paymentRepository,
                                 EventPublisherPort eventPublisherPort) {
        this.paymentRepository = paymentRepository;
        this.eventPublisherPort = eventPublisherPort;
    }

    @Override
    public void execute(WebhookCommand command) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(command.stripePaymentIntentId())
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for intent: " + command.stripePaymentIntentId()));

        if (payment.getStatus() == PaymentStatus.COMPLETED || payment.getStatus() == PaymentStatus.FAILED) {
            return;
        }

        switch (command.eventType()) {
            case PAYMENT_SUCCEEDED -> handleCompleted(payment, command.stripePaymentIntentId());
            case PAYMENT_FAILED -> handleFailed(payment, command.failureReason());
            case UNSUPPORTED -> {
                return;
            }
        }
    }

    @Override
    public void expirePendingPayment(Payment payment, String reason) {
        payment.markFailed(reason);
        paymentRepository.save(payment);

        if (payment.getTargetType() == PaymentTargetType.ORDER) {
            eventPublisherPort.publish(new OrderPaymentExpiredEvent(
                    payment.getId(),
                    payment.getOrderId(),
                    payment.getUserId(),
                    reason
            ));
            return;
        }

        eventPublisherPort.publish(new PaymentExpiredEvent(
                payment.getId(),
                payment.getSubscriptionId(),
                payment.getUserId(),
                reason
        ));
    }

    private void handleCompleted(Payment payment, String stripePaymentIntentId) {
        payment.markCompleted(stripePaymentIntentId);
        paymentRepository.save(payment);

        if (payment.getTargetType() == PaymentTargetType.ORDER) {
            eventPublisherPort.publish(new OrderPaymentCompletedEvent(
                    payment.getId(),
                    payment.getOrderId(),
                    payment.getUserId(),
                    payment.getAmount().amount(),
                    payment.getAmount().currency(),
                    payment.getCompletedAt()
            ));
            return;
        }

        eventPublisherPort.publish(new PaymentCompletedEvent(
                payment.getId(),
                payment.getSubscriptionId(),
                payment.getUserId(),
                payment.getAmount().amount(),
                payment.getAmount().currency(),
                payment.getCompletedAt()
        ));
    }

    private void handleFailed(Payment payment, String failureReason) {
        payment.markFailed(failureReason);
        paymentRepository.save(payment);

        if (payment.getTargetType() == PaymentTargetType.ORDER) {
            eventPublisherPort.publish(new OrderPaymentFailedEvent(
                    payment.getId(),
                    payment.getOrderId(),
                    payment.getUserId(),
                    payment.getFailureReason()
            ));
            return;
        }

        eventPublisherPort.publish(new PaymentFailedEvent(
                payment.getId(),
                payment.getSubscriptionId(),
                payment.getUserId(),
                payment.getFailureReason()
        ));
    }
}
