import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CartItem } from '../../models/cart.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'app-cart-list',
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './cart-list.component.html',
  styleUrl: './cart-list.component.css'
})
export class CartListComponent implements OnInit {
  private readonly cartService  = inject(CartService);
  private readonly toastService = inject(ToastService);
  private readonly router       = inject(Router);

  cart      = this.cartService.cart$;
  isLoading = this.cartService.isLoading$;

  updatingItemId: string | null = null;

  ngOnInit(): void {
    this.cartService.getCart().subscribe();
  }

  onQuantityChange(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1 || newQuantity === item.quantity) return;
    this.updatingItemId = item.id;
    this.cartService.updateCartItem(item.id, newQuantity).subscribe({
      next:  () => { this.toastService.success('Cart updated'); this.updatingItemId = null; },
      error: (error) => {
        this.toastService.error(error?.error?.error || 'Failed to update cart');
        this.updatingItemId = null;
      }
    });
  }

  onRemoveItem(item: CartItem): void {
    if (!confirm(`Remove "${item.productName}" from cart?`)) return;
    this.cartService.removeFromCart(item.id).subscribe({
      next:  () => this.toastService.success('Item removed'),
      error: () => this.toastService.error('Failed to remove item')
    });
  }

  onClearCart(): void {
    if (!confirm('Clear your entire cart?')) return;
    this.cartService.clearCart().subscribe({
      next:  () => this.toastService.success('Cart cleared'),
      error: () => this.toastService.error('Failed to clear cart')
    });
  }

  getItemImageUrl(item: CartItem): string {
    return this.cartService.getItemImageUrl(item);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/img/default-product.svg';
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  trackByItemId(_: number, item: CartItem): string {
    return item.id;
  }

  onProceedToCheckout(event: Event): void {
    if (!this.hasStockIssue()) {
      return;
    }

    event.preventDefault();
    this.toastService.error('Resolve out-of-stock items before checkout');
  }

  isItemOutOfStock(item: CartItem): boolean {
    return item.productStatus === 'OUT_OF_STOCK' || item.productStockQuantity <= 0;
  }

  isAtStockLimit(item: CartItem): boolean {
    return item.productStockQuantity > 0 && item.quantity >= item.productStockQuantity;
  }

  hasStockIssue(): boolean {
    const items = this.cart()?.items ?? [];
    return items.some(item => this.isItemOutOfStock(item) || item.quantity > item.productStockQuantity);
  }
}
