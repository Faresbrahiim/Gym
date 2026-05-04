import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService    = inject(CartService);
  private readonly toastService   = inject(ToastService);
  private readonly route          = inject(ActivatedRoute);

  product   = this.productService.selectedProduct$;
  isLoading = this.productService.isLoading$;
  quantity  = signal(1);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProduct(id).subscribe();
    }
  }

  increase(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.quantity.update(current => Math.min(current + 1, Math.max(product.stockQuantity, 1)));
  }

  decrease(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;

    if (!this.canPurchase()) {
      this.toastService.error('This product is out of stock');
      return;
    }

    this.cartService.addToCart(p.id, this.quantity()).subscribe({
      next:  () => this.toastService.success(`${p.name} added to cart`),
      error: (error) => this.toastService.error(error?.error?.error || 'Failed to add to cart'),
    });
  }

  getImageUrl(): string {
    const p = this.product();
    if (!p) return '/assets/default-product.svg';
    return this.productService.getImageUrl(p.id);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/default-product.svg';
  }

  get productBreadcrumbs() {
    return [{label: 'Home', link: '/home'}, {label: 'Shop', link: '/store'}, {label: this.product()?.name ?? ''}];
  }

  canPurchase(): boolean {
    const product = this.product();
    return !!product && product.status === 'AVAILABLE' && product.stockQuantity > 0;
  }

  isAtStockLimit(): boolean {
    const product = this.product();
    return !!product && this.quantity() >= product.stockQuantity;
  }
}
