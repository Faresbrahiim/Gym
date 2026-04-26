package com.gym.payment.adapter.in.web.mapper;

import com.gym.payment.adapter.in.web.dto.InitiatePaymentResponse;
import com.gym.payment.adapter.in.web.dto.PagedResponse;
import com.gym.payment.adapter.in.web.dto.PaymentResponse;
import com.gym.payment.domain.port.in.PagedResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PaymentWebMapper {

    public InitiatePaymentResponse toInitiateResponse(com.gym.payment.domain.port.in.InitiatePaymentResponse response) {
        return new InitiatePaymentResponse(response.paymentId(), response.clientSecret());
    }

    public PaymentResponse toPaymentResponse(com.gym.payment.domain.port.in.PaymentResponse response) {
        return new PaymentResponse(
                response.id(),
                response.userId(),
                response.targetType(),
                response.subscriptionId(),
                response.planId(),
                response.orderId(),
                response.amount(),
                response.currency(),
                response.status(),
                response.stripePaymentIntentId(),
                response.failureReason(),
                response.createdAt(),
                response.completedAt()
        );
    }

    public List<PaymentResponse> toPaymentResponses(List<com.gym.payment.domain.port.in.PaymentResponse> responses) {
        return responses.stream().map(this::toPaymentResponse).toList();
    }

    public PagedResponse<PaymentResponse> toPagedResponse(PagedResult<com.gym.payment.domain.port.in.PaymentResponse> result) {
        return PagedResponse.of(
                toPaymentResponses(result.items()),
                result.page(),
                result.pageSize(),
                result.totalItems()
        );
    }
}
