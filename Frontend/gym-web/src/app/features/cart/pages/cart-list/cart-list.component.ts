import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-cart-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart-list.component.html',
  styleUrl: './cart-list.component.css'
})
export class CartListComponent implements OnInit {
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  cart = this.cartService.cart$;
  isLoading = this.cartService.isLoading$;

  ngOnInit(): void {
    this.cartService.getCart().subscribe();
  }

  onQuantityChange(itemId: number, newQuantity: number): void {
    if (newQuantity > 0) {
      this.cartService.updateCartItem(itemId, newQuantity).subscribe({
        next: () => {
          this.toastService.success('Cart updated');
        },
        error: () => {
          this.toastService.error('Failed to update cart');
        }
      });
    }
  }

  onRemoveItem(itemId: number): void {
    this.cartService.removeFromCart(itemId).subscribe({
      next: () => {
        this.toastService.success('Item removed from cart');
      },
      error: () => {
        this.toastService.error('Failed to remove item');
      }
    });
  }

  onClearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => {
          this.toastService.success('Cart cleared');
        },
        error: () => {
          this.toastService.error('Failed to clear cart');
        }
      });
    }
  }

  onContinueShopping(): void {
    this.router.navigate(['/products']);
  }

  onCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  formatPrice(price: number | string): string {
    const numPrice = Number(price) || 0;
    return numPrice.toFixed(2);
  }
}
