import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Cart, CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private api = inject(ApiService);
  
  cart$ = signal<Cart | null>(null);
  isLoading$ = signal<boolean>(false);
  error$ = signal<string | null>(null);

  getCart(): Observable<Cart> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<Cart>('/store/cart').pipe(
      tap((cart) => {
        // Normalize numeric values from backend
        const normalizedCart = this.normalizeCart(cart);
        this.cart$.set(normalizedCart);
        this.isLoading$.set(false);
      }),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to load cart';
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error loading cart:', error);
        return of({ id: 0, userId: 0, items: [], totalItems: 0, totalPrice: 0, status: 'ACTIVE' } as Cart);
      })
    );
  }

  private normalizeCart(cart: Cart): Cart {
    return {
      ...cart,
      totalPrice: Number(cart.totalPrice) || 0,
      totalItems: Number(cart.totalItems) || 0,
      items: cart.items.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0
      }))
    };
  }

  addToCart(productId: number, quantity: number): Observable<CartItem> {
    this.error$.set(null);
    return this.api.post<CartItem>('/store/cart/items', { productId, quantity }).pipe(
      tap(() => this.loadCart()),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to add to cart';
        this.error$.set(errorMsg);
        console.error('Error adding to cart:', error);
        throw error;
      })
    );
  }

  updateCartItem(id: number, quantity: number): Observable<CartItem> {
    this.error$.set(null);
    return this.api.put<CartItem>(`/store/cart/items/${id}`, { quantity }).pipe(
      tap(() => this.loadCart()),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to update cart';
        this.error$.set(errorMsg);
        console.error('Error updating cart:', error);
        throw error;
      })
    );
  }

  removeFromCart(id: number): Observable<void> {
    this.error$.set(null);
    return this.api.delete<void>(`/store/cart/items/${id}`).pipe(
      tap(() => this.loadCart()),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to remove item';
        this.error$.set(errorMsg);
        console.error('Error removing from cart:', error);
        throw error;
      })
    );
  }

  clearCart(): Observable<void> {
    this.error$.set(null);
    return this.api.delete<void>('/store/cart/clear').pipe(
      tap(() => this.cart$.set(null)),
      catchError((error) => {
        const errorMsg = error?.error?.error || 'Failed to clear cart';
        this.error$.set(errorMsg);
        console.error('Error clearing cart:', error);
        throw error;
      })
    );
  }

  private loadCart(): void {
    this.getCart().subscribe();
  }

  getTotalItems(): number {
    return this.cart$()?.totalItems || 0;
  }

  getTotalPrice(): number {
    return this.cart$()?.totalPrice || 0;
  }
}
