import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { InitiatePaymentRequest } from '../models/initiate-payment.request';
import { InitiatePaymentResponse } from '../models/initiate-payment.response';
import { PaymentResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private myPaymentsCache$ = new ReplaySubject<PaymentResponse[]>(1);
  private cacheInitialized = false;

  constructor(private apiService: ApiService) {}

  initiatePayment(request: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.apiService.post<InitiatePaymentResponse>('/api/payments/initiate', request).pipe(
      tap(() => {
        // Invalidate cache when a new payment is initiated
        this.cacheInitialized = false;
        this.getMyPayments().subscribe();
      })
    );
  }

  getMyPayments(): Observable<PaymentResponse[]> {
    const request$ = this.apiService.get<PaymentResponse[]>('/api/payments/me').pipe(
      tap(payments => {
        // Sort descending by createdAt
        const sorted = payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.myPaymentsCache$.next(sorted);
        this.cacheInitialized = true;
      })
    );

    if (!this.cacheInitialized) {
      request$.subscribe();
    }

    return this.myPaymentsCache$.asObservable();
  }

  getPaymentById(paymentId: string): Observable<PaymentResponse | undefined> {
    return this.getMyPayments().pipe(
      map(payments => payments.find(p => p.id === paymentId))
    );
  }
}
