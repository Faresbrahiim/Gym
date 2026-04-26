package com.gym.payment.application;

import com.gym.payment.domain.model.Money;
import com.gym.payment.domain.model.Payment;
import com.gym.payment.domain.port.in.InitiateOrderPaymentCommand;
import com.gym.payment.domain.port.in.InitiateOrderPaymentUseCase;
import com.gym.payment.domain.port.in.InitiatePaymentCommand;
import com.gym.payment.domain.port.in.InitiatePaymentResponse;
import com.gym.payment.domain.port.in.InitiatePaymentUseCase;
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

@Service
@Transactional
public class PaymentInitiationService implements InitiatePaymentUseCase, InitiateOrderPaymentUseCase {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayPort paymentGatewayPort;
    private final PlanGatewayPort planGatewayPort;
    private final SubscriptionGatewayPort subscriptionGatewayPort;
    private final OrderGatewayPort orderGatewayPort;

    public PaymentInitiationService(PaymentRepository paymentRepository,
                                    PaymentGatewayPort paymentGatewayPort,
                                    PlanGatewayPort planGatewayPort,
                                    SubscriptionGatewayPort subscriptionGatewayPort,
                                    OrderGatewayPort orderGatewayPort) {
        this.paymentRepository = paymentRepository;
        this.paymentGatewayPort = paymentGatewayPort;
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
}
