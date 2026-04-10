import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  product = this.productService.selectedProduct$;
  isLoading = this.productService.isLoading$;
  quantity = signal(1);
  
  relatedProducts = signal([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = parseInt(params['id']);
      if (id) {
        this.productService.getProduct(id).subscribe();
      }
    });
  }

  increaseQuantity(): void {
    const current = this.quantity();
    const maxStock = this.product()?.stock || 1;
    if (current < maxStock) {
      this.quantity.set(current + 1);
    }
  }

  decreaseQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  onAddToCart(): void {
    const prod = this.product();
    if (prod) {
      this.cartService.addToCart(prod.id, this.quantity()).subscribe({
        next: () => {
          this.toastService.success(`${prod.name} added to cart`);
          this.quantity.set(1);
        },
        error: () => {
          this.toastService.error('Failed to add to cart');
        }
      });
    }
  }

  getDiscountPercentage(original: number, discounted?: number): number {
    if (!discounted) return 0;
    return Math.round(((original - discounted) / original) * 100);
  }
}
