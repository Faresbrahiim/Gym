import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Order, CheckoutResponse } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  orders$         = signal<Order[]>([]);
  selectedOrder$  = signal<Order | null>(null);
  isLoading$      = signal(false);
  error$          = signal<string | null>(null);

  getOrders(): Observable<Order[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<any[]>('/store/orders').pipe(
      map(orders => (Array.isArray(orders) ? orders : []).map(o => this.normalize(o))),
      tap(orders => {
        this.orders$.set(orders);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to load orders');
        this.isLoading$.set(false);
        return of([]);
      })
    );
  }

  getOrder(id: string): Observable<Order> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<any>(`/store/orders/${id}`).pipe(
      map(o => this.normalize(o)),
      tap(order => {
        this.selectedOrder$.set(order);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to load order');
        this.isLoading$.set(false);
        throw error;
      })
    );
  }

  checkout(shippingAddress: string, paymentMethod: string): Observable<CheckoutResponse> {
    this.error$.set(null);
    return this.api.post<CheckoutResponse>('/store/checkout', {
      address: shippingAddress,
      paymentMethod,
    }).pipe(
      catchError(error => {
        this.error$.set(error?.error?.error || 'Checkout failed');
        throw error;
      })
    );
  }

  cancelOrder(id: string): Observable<any> {
    this.error$.set(null);
    return this.api.post<any>(`/store/orders/${id}/cancel`, {}).pipe(
      tap(() => {
        const current = this.selectedOrder$();
        if (current?.id === id) {
          this.selectedOrder$.set({ ...current, status: 'CANCELLED' });
        }
      }),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to cancel order');
        throw error;
      })
    );
  }

  private normalize(o: any): Order {
    return {
      id:         String(o.id),
      userId:     String(o.userId ?? ''),
      status:     o.status,
      totalPrice: Number(o.totalPrice),
      items:      (o.items ?? []).map((item: any) => ({
        productId:   String(item.productId),
        productName: item.productName ?? '',
        price:       Number(item.price),
        quantity:    Number(item.quantity),
        image:       item.image ?? null,
      })),
      createdAt:  o.createdAt,
      updatedAt:  o.updatedAt,
    };
  }
}
