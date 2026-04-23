import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InitiatePaymentRequest } from '../models/initiate-payment.request';
import { InitiatePaymentResponse } from '../models/initiate-payment.response';
import { PaymentResponse } from '../models/payment.model';
import { PagedResponse } from '../../../core/models/paged-response.model';
import { PaymentStatus } from '../models/payment-status.enum';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private apiService: ApiService) {}

  initiatePayment(request: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.apiService.post<InitiatePaymentResponse>('/api/payments/initiate', request).pipe(
      tap(() => void 0)
    );
  }

  getMyPayments(page = 1, pageSize = 10, status?: PaymentStatus): Observable<PagedResponse<PaymentResponse>> {
    return this.apiService.get<PagedResponse<PaymentResponse>>('/api/payments/me', {
      params: {
        page,
        pageSize,
        status
      }
    });
  }

  getPaymentById(paymentId: string): Observable<PaymentResponse> {
    return this.apiService.get<PaymentResponse>(`/api/payments/me/${paymentId}`);
  }
}
