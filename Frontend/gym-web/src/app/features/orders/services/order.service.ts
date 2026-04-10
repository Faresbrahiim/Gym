import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private api = inject(ApiService);
  
  orders$ = signal<Order[]>([]);
  selectedOrder$ = signal<Order | null>(null);
  isLoading$ = signal<boolean>(false);
  error$ = signal<string | null>(null);

  getOrders(page: number = 1, limit: number = 10): Observable<Order[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    // Backend returns Order[] directly
    return this.api.get<Order[]>(`/store/orders`).pipe(
      tap((orders) => {
        this.orders$.set(Array.isArray(orders) ? orders : []);
        this.isLoading$.set(false);
      }),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to load orders';
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error loading orders:', error);
        return of([]);
      })
    );
  }

  getOrder(id: number): Observable<Order> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<Order>(`/store/orders/${id}`).pipe(
      tap((order) => {
        this.selectedOrder$.set(order);
        this.isLoading$.set(false);
      }),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to load order';
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error loading order:', error);
        throw error;
      })
    );
  }

  createOrder(shippingAddress: string): Observable<Order> {
    this.error$.set(null);
    return this.api.post<Order>('/store/checkout', { address: shippingAddress, paymentMethod: 'credit_card' }).pipe(
      tap((order) => this.selectedOrder$.set(order)),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to create order';
        this.error$.set(errorMsg);
        console.error('Error creating order:', error);
        throw error;
      })
    );
  }

  cancelOrder(id: number): Observable<Order> {
    this.error$.set(null);
    return this.api.patch<Order>(`/store/orders/${id}/cancel`, {}).pipe(
      tap((order) => this.selectedOrder$.set(order as Order)),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to cancel order';
        this.error$.set(errorMsg);
        console.error('Error canceling order:', error);
        throw error;
      })
    );
  }
}
