import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentResponse,
} from '../models/initiate-payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private readonly BASE = '/api/payments';

  private readonly api = inject(ApiService);

  initiate(req: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.api.post<InitiatePaymentResponse>(`${this.BASE}/initiate`, req);
  }

  getMyPayments(): Observable<PaymentResponse[]> {
    return this.api.get<PaymentResponse[]>(`${this.BASE}/me`);
  }
}
