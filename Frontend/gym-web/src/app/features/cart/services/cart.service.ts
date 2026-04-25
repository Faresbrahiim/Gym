import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Cart, CartItem } from '../models/cart.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);

  cart$      = signal<Cart | null>(null);
  isLoading$ = signal(false);
  error$     = signal<string | null>(null);

  getCart(): Observable<Cart> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<any>('/store/cart').pipe(
      map(raw => this.normalizeCart(raw)),
      tap(cart => {
        this.cart$.set(cart);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to load cart');
        this.isLoading$.set(false);
        const empty: Cart = { id: '', items: [], totalPrice: 0, totalItems: 0 };
        return of(empty);
      })
    );
  }

  addToCart(productId: string, quantity: number): Observable<any> {
    this.error$.set(null);
    return this.api.post<any>('/store/cart/items', { productId, quantity }).pipe(
      tap(() => this.reload()),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to add to cart');
        throw error;
      })
    );
  }

  updateCartItem(itemId: string, quantity: number): Observable<any> {
    this.error$.set(null);
    return this.api.put<any>(`/store/cart/items/${itemId}`, { quantity }).pipe(
      tap(() => this.reload()),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to update cart');
        throw error;
      })
    );
  }

  removeFromCart(itemId: string): Observable<void> {
    this.error$.set(null);
    return this.api.delete<void>(`/store/cart/items/${itemId}`).pipe(
      tap(() => this.reload()),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to remove item');
        throw error;
      })
    );
  }

  clearCart(): Observable<void> {
    this.error$.set(null);
    return this.api.delete<void>('/store/cart').pipe(
      tap(() => {
        this.cart$.set({ id: '', items: [], totalPrice: 0, totalItems: 0 });
      }),
      catchError(error => {
        this.error$.set(error?.error?.error || 'Failed to clear cart');
        throw error;
      })
    );
  }

  getItemImageUrl(item: CartItem): string {
    return `${environment.apiUrl}/store/products/${item.productId}/image`;
  }

  getTotalItems(): number {
    return this.cart$()?.totalItems ?? 0;
  }

  getTotalPrice(): number {
    return this.cart$()?.totalPrice ?? 0;
  }

  private reload(): void {
    this.getCart().subscribe();
  }

  private normalizeCart(raw: any): Cart {
    const items: CartItem[] = (raw.items ?? []).map((item: any) => ({
      id:                 String(item.id),
      productId:          String(item.productId),
      productName:        item.productName ?? `Product #${item.productId}`,
      price:              Number(item.price),
      quantity:           Number(item.quantity),
      productImage:       item.productImage ?? null,
      productDescription: item.productDescription ?? null,
      productStatus:      item.productStatus ?? null,
    }));

    const totalPrice = Number(raw.totalPrice) || 0;
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    return { id: String(raw.id), items, totalPrice, totalItems };
  }
}
