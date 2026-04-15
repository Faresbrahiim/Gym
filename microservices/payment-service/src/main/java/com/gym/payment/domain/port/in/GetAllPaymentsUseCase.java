package com.gym.payment.domain.port.in;

import java.util.List;

public interface GetAllPaymentsUseCase {
    List<PaymentResponse> execute(GetAllPaymentsQuery query);
}
