package com.gym.payment.application;

import com.gym.payment.domain.event.PaymentCompletedEvent;
import com.gym.payment.domain.event.PaymentFailedEvent;
import com.gym.payment.domain.exception.PaymentNotFoundException;
import com.gym.payment.domain.model.Money;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.port.in.*;
import com.gym.payment.domain.port.out.EventPublisherPort;
import com.gym.payment.domain.port.out.GatewayResult;
import com.gym.payment.domain.port.out.PaymentGatewayPort;
import com.gym.payment.domain.port.out.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PaymentApplicationService implements
        InitiatePaymentUseCase,
        HandleWebhookUseCase,
        GetMyPaymentHistoryUseCase,
        GetAllPaymentsUseCase,
        GetLatestSubscriptionPaymentUseCase {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayPort paymentGatewayPort;
    private final EventPublisherPort eventPublisherPort;

    public PaymentApplicationService(PaymentRepository paymentRepository,
                                     PaymentGatewayPort paymentGatewayPort,
                                     EventPublisherPort eventPublisherPort) {
        this.paymentRepository = paymentRepository;
        this.paymentGatewayPort = paymentGatewayPort;
        this.eventPublisherPort = eventPublisherPort;
    }

    @Override
    public InitiatePaymentResponse execute(InitiatePaymentCommand command) {
        Money money = new Money(command.amount(), command.currency());
        GatewayResult result = paymentGatewayPort.createPaymentIntent(money, command.paymentMethodToken());
        Payment payment = new Payment(command.userId(), command.subscriptionId(), command.planId(), money);
        payment.assignStripePaymentIntentId(result.paymentIntentId());
        paymentRepository.save(payment);
        return new InitiatePaymentResponse(payment.getId(), result.clientSecret());
    }

    @Override
    public void execute(WebhookCommand command) {
        Payment payment = paymentRepository
                .findByStripePaymentIntentId(command.stripePaymentIntentId())
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for intent: " + command.stripePaymentIntentId()));

        if (payment.getStatus() == PaymentStatus.COMPLETED || payment.getStatus() == PaymentStatus.FAILED) {
            return;
        }

        if ("payment_intent.succeeded".equals(command.eventType())) {
            payment.markCompleted(command.stripePaymentIntentId());
            paymentRepository.save(payment);
            eventPublisherPort.publish("payment.completed", new PaymentCompletedEvent(
                    payment.getId(),
                    payment.getSubscriptionId(),
                    payment.getUserId(),
                    payment.getAmount().amount(),
                    payment.getAmount().currency(),
                    payment.getCompletedAt()
            ));
        } else {
            payment.markFailed(command.failureReason());
            paymentRepository.save(payment);
            eventPublisherPort.publish("payment.failed", new PaymentFailedEvent(
                    payment.getId(),
                    payment.getSubscriptionId(),
                    payment.getUserId(),
                    payment.getFailureReason()
            ));
        }
    }

    @Override
    public List<PaymentResponse> execute(UUID userId) {
        return paymentRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<PaymentResponse> execute(GetAllPaymentsQuery query) {
        return paymentRepository.findAll(query)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Optional<PaymentResponse> executeForSubscription(UUID subscriptionId) {
        return paymentRepository.findLatestBySubscriptionId(subscriptionId)
                .map(this::toResponse);
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getUserId(),
                payment.getSubscriptionId(),
                payment.getPlanId(),
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
