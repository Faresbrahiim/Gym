import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { Observable } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { InitiatePaymentRequest } from '../models/initiate-payment.request';
import { InitiatePaymentResponse } from '../models/initiate-payment.response';
import { PaymentResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentsCache$?: Observable<PaymentResponse[]>;

  constructor(private apiService: ApiService) {}

  initiatePayment(request: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.apiService.post<InitiatePaymentResponse>('/api/payments/initiate', request).pipe(
      tap(() => {
        // Invalidate cache when a new payment is initiated
        this.paymentsCache$ = undefined;
      })
    );
  }

  getMyPayments(): Observable<PaymentResponse[]> {
    if (!this.paymentsCache$) {
      this.paymentsCache$ = this.apiService.get<PaymentResponse[]>('/api/payments/me').pipe(
        map(payments => payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
        shareReplay(1)
      );
    }
    return this.paymentsCache$;
  }

  getPaymentById(paymentId: string): Observable<PaymentResponse | undefined> {
    return this.getMyPayments().pipe(
      map(payments => payments.find(p => p.id === paymentId))
    );
  }
}
