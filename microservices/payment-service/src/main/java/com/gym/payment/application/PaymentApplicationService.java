package com.gym.payment.application;

import com.gym.payment.domain.event.PaymentCompletedEvent;
import com.gym.payment.domain.event.PaymentFailedEvent;
import com.gym.payment.domain.event.OrderPaymentCompletedEvent;
import com.gym.payment.domain.event.OrderPaymentFailedEvent;
import com.gym.payment.domain.exception.PaymentNotFoundException;
import com.gym.payment.domain.model.Money;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.model.PaymentStatus;
import com.gym.payment.domain.model.PaymentTargetType;
import com.gym.payment.domain.port.in.*;
import com.gym.payment.domain.port.out.EventPublisherPort;
import com.gym.payment.domain.port.out.GatewayResult;
import com.gym.payment.domain.port.out.OrderGatewayPort;
import com.gym.payment.domain.port.out.OrderPaymentDetails;
import com.gym.payment.domain.port.out.PaymentGatewayPort;
import com.gym.payment.domain.port.out.PaymentRepository;
import com.gym.payment.domain.port.out.PlanGatewayPort;
import com.gym.payment.domain.port.out.PlanPricing;
import com.gym.payment.domain.port.out.SubscriptionGatewayPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PaymentApplicationService implements
        InitiatePaymentUseCase,
        InitiateOrderPaymentUseCase,
        HandleWebhookUseCase,
        GetMyPaymentHistoryUseCase,
        GetMyPaymentByIdUseCase,
        GetAllPaymentsUseCase,
        GetLatestSubscriptionPaymentUseCase {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayPort paymentGatewayPort;
    private final EventPublisherPort eventPublisherPort;
    private final PlanGatewayPort planGatewayPort;
    private final SubscriptionGatewayPort subscriptionGatewayPort;
    private final OrderGatewayPort orderGatewayPort;

    public PaymentApplicationService(PaymentRepository paymentRepository,
                                     PaymentGatewayPort paymentGatewayPort,
                                     EventPublisherPort eventPublisherPort,
                                     PlanGatewayPort planGatewayPort,
                                     SubscriptionGatewayPort subscriptionGatewayPort,
                                     OrderGatewayPort orderGatewayPort) {
        this.paymentRepository = paymentRepository;
        this.paymentGatewayPort = paymentGatewayPort;
        this.eventPublisherPort = eventPublisherPort;
        this.planGatewayPort = planGatewayPort;
        this.subscriptionGatewayPort = subscriptionGatewayPort;
        this.orderGatewayPort = orderGatewayPort;
    }

    @Override
    public InitiatePaymentResponse execute(InitiatePaymentCommand command) {
        subscriptionGatewayPort.ensureOwnedByUser(command.userId(), command.subscriptionId());
        PlanPricing pricing = planGatewayPort.getPlanPricing(command.planId());
        Money money = new Money(pricing.amount(), pricing.currency());
        GatewayResult result = paymentGatewayPort.createPaymentIntent(money, command.paymentMethodToken());
        Payment payment = Payment.forMembership(command.userId(), command.subscriptionId(), command.planId(), money);
        payment.assignStripePaymentIntentId(result.paymentIntentId());
        paymentRepository.save(payment);
        return new InitiatePaymentResponse(payment.getId(), result.clientSecret());
    }

    @Override
    public InitiatePaymentResponse execute(InitiateOrderPaymentCommand command) {
        OrderPaymentDetails order = orderGatewayPort.getOrderPaymentDetails(command.userId(), command.orderId());
        Money money = new Money(order.amount(), order.currency());
        GatewayResult result = paymentGatewayPort.createPaymentIntent(money, command.paymentMethodToken());
        Payment payment = Payment.forOrder(command.userId(), order.orderId(), money);
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
            if (payment.getTargetType() == PaymentTargetType.ORDER) {
                eventPublisherPort.publish("order-payment.completed", new OrderPaymentCompletedEvent(
                        payment.getId(),
                        payment.getOrderId(),
                        payment.getUserId(),
                        payment.getAmount().amount(),
                        payment.getAmount().currency(),
                        payment.getCompletedAt()
                ));
            } else {
                eventPublisherPort.publish("payment.completed", new PaymentCompletedEvent(
                        payment.getId(),
                        payment.getSubscriptionId(),
                        payment.getUserId(),
                        payment.getAmount().amount(),
                        payment.getAmount().currency(),
                        payment.getCompletedAt()
                ));
            }
        } else if ("payment_intent.payment_failed".equals(command.eventType())) {
            payment.markFailed(command.failureReason());
            paymentRepository.save(payment);
            if (payment.getTargetType() == PaymentTargetType.ORDER) {
                eventPublisherPort.publish("order-payment.failed", new OrderPaymentFailedEvent(
                        payment.getId(),
                        payment.getOrderId(),
                        payment.getUserId(),
                        payment.getFailureReason()
                ));
            } else {
                eventPublisherPort.publish("payment.failed", new PaymentFailedEvent(
                        payment.getId(),
                        payment.getSubscriptionId(),
                        payment.getUserId(),
                        payment.getFailureReason()
                ));
            }
        }
    }

    @Override
    public PagedResult<PaymentResponse> execute(UUID userId, PaymentStatus status, PaymentTargetType targetType, int page, int pageSize) {
        PagedResult<Payment> pagedPayments = paymentRepository.findPage(
                new GetAllPaymentsQuery(userId, status, targetType, null, null),
                page,
                pageSize
        );

        return new PagedResult<>(
                pagedPayments.items().stream().map(this::toResponse).toList(),
                pagedPayments.page(),
                pagedPayments.pageSize(),
                pagedPayments.totalItems()
        );
    }

    @Override
    public Optional<PaymentResponse> execute(UUID userId, UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .filter(payment -> payment.getUserId().equals(userId))
                .map(this::toResponse);
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
                payment.getTargetType(),
                payment.getSubscriptionId(),
                payment.getPlanId(),
                payment.getOrderId(),
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
