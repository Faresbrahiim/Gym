import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Product } from '../models/product.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  products$       = signal<Product[]>([]);
  selectedProduct$ = signal<Product | null>(null);
  isLoading$      = signal(false);
  error$          = signal<string | null>(null);

  getProducts(): Observable<Product[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<any[]>('/store/products').pipe(
      map(products => products.map(p => this.normalize(p))),
      tap(products => {
        this.products$.set(products);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Failed to load products');
        this.isLoading$.set(false);
        return of([]);
      })
    );
  }

  getProduct(id: string): Observable<Product> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<any>(`/store/products/${id}`).pipe(
      map(p => this.normalize(p)),
      tap(product => {
        this.selectedProduct$.set(product);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Failed to load product');
        this.isLoading$.set(false);
        return throwError(() => error);
      })
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<any[]>(`/store/products/search`, { params: { productName: query } }).pipe(
      map(products => products.map(p => this.normalize(p))),
      tap(products => {
        this.products$.set(products);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Search failed');
        this.isLoading$.set(false);
        return of([]);
      })
    );
  }

  getImageUrl(productId: string): string {
    return `${environment.apiUrl}/store/products/${productId}/image`;
  }

  private normalize(p: any): Product {
    return {
      id:          p.id,
      name:        p.name,
      description: p.description ?? '',
      price:       Number(p.price),
      stockQuantity: Number(p.stockQuantity ?? 0),
      imagePath:   p.imagePath ?? null,
      status:      p.status,
      createdAt:   p.createdAt,
      updatedAt:   p.updatedAt,
    };
  }
}
