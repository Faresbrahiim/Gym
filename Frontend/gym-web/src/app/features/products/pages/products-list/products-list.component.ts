import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Product } from '../../models/product.model';

@Component({
  standalone: true,
  selector: 'app-products-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService    = inject(CartService);
  private readonly toastService   = inject(ToastService);

  products  = this.productService.products$;
  isLoading = this.productService.isLoading$;
  error     = this.productService.error$;

  searchQuery = '';

  get filteredProducts(): Product[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe();
  }

  onSearch(value: string): void {
    this.searchQuery = value;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1).subscribe({
      next:  () => this.toastService.success(`${product.name} added to cart`),
      error: () => this.toastService.error('Failed to add to cart'),
    });
  }

  getImageUrl(product: Product): string {
    return this.productService.getImageUrl(product.id);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/img/default-product.svg';
  }

  trackByProductId(_: number, product: Product): string {
    return product.id;
  }
}
