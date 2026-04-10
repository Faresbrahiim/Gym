import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { Product } from '../../models/product.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-products-list',
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  products = this.productService.products$;
  isLoading = this.productService.isLoading$;
  
  currentPage = signal(1);
  itemsPerPage = signal(12);
  selectedCategory = signal('');
  searchQuery = signal('');
  
  categories = ['All', 'Supplements', 'Equipment', 'Apparel', 'Accessories'];

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    const page = this.currentPage();
    const limit = this.itemsPerPage();
    this.productService.getProducts(page, limit).subscribe();
  }

  onSearch(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      const category = this.selectedCategory() !== 'All' ? this.selectedCategory() : undefined;
      this.productService.searchProducts(query, category).subscribe();
    } else {
      this.loadProducts();
    }
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    
    if (category === 'All') {
      this.loadProducts();
    } else {
      this.productService.getProductsByCategory(category).subscribe();
    }
  }

  onAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.toastService.success(`${product.name} added to cart`);
      },
      error: () => {
        this.toastService.error('Failed to add to cart');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  getDiscountPercentage(original: number, discounted?: number): number {
    if (!discounted) return 0;
    return Math.round(((original - discounted) / original) * 100);
  }
}
