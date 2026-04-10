import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);
  
  products$ = signal<Product[]>([]);
  selectedProduct$ = signal<Product | null>(null);
  isLoading$ = signal<boolean>(false);
  error$ = signal<string | null>(null);

  getProducts(page: number = 1, limit: number = 10): Observable<Product[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    // Backend returns Product[] directly, not wrapped in {data}
    return this.api.get<Product[]>(`/store/products`).pipe(
      tap((products) => {
        this.products$.set(Array.isArray(products) ? products : []);
        this.isLoading$.set(false);
      }),
      tap(() => this.error$.set(null)),
      catchError((error) => {
        const errorMsg = error?.error?.message || 'Failed to load products';
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error loading products:', error);
        return of([]);
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<Product>(`/store/products/${id}`).pipe(
      tap((product) => {
        this.selectedProduct$.set(product);
        this.isLoading$.set(false);
      }),
      catchError((error) => {
        const errorMsg = error?.error?.message || 'Failed to load product';
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error loading product:', error);
        return throwError(() => error);
      })
    );
  }

  searchProducts(query: string, category?: string): Observable<Product[]> {
    let url = `/store/products/search?productName=${query}`;
    if (category) {
      url += `&category=${category}`;
    }
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<Product[]>(url).pipe(
      tap((products) => {
        this.products$.set(Array.isArray(products) ? products : []);
        this.isLoading$.set(false);
      }),
      catchError((error) => {
        const errorMsg = error?.error?.message || 'Search failed';
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error searching products:', error);
        return of([]);
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<Product[]>(`/store/products/category/${category}`).pipe(
      tap((products) => {
        this.products$.set(Array.isArray(products) ? products : []);
        this.isLoading$.set(false);
      }),
      catchError((error) => {
        const errorMsg = error?.error?.message || `Failed to load ${category} products`;
        this.error$.set(errorMsg);
        this.isLoading$.set(false);
        console.error('Error loading category products:', error);
        return of([]);
      })
    );
  }
}
