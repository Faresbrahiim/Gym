package com.gym.payment.adapter.out.messaging;

final class PaymentTopicNames {

    static final String MEMBERSHIP_COMPLETED = "payment.completed";
    static final String MEMBERSHIP_FAILED = "payment.failed";
    static final String MEMBERSHIP_EXPIRED = "payment.expired";
    static final String ORDER_COMPLETED = "order-payment.completed";
    static final String ORDER_FAILED = "order-payment.failed";
    static final String ORDER_EXPIRED = "order-payment.expired";

    private PaymentTopicNames() {
    }
}
