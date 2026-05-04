import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { environment } from '../../../../environments/environment';

export interface BackendProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  status: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  price: string;
  stockQuantity: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductAdminService {
  private readonly api = inject(ApiService);

  products$  = signal<BackendProduct[]>([]);
  isLoading$ = signal(false);
  error$     = signal<string | null>(null);

  getAllProducts(): Observable<BackendProduct[]> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.get<BackendProduct[]>('/store/admin/products').pipe(
      tap(products => {
        this.products$.set(Array.isArray(products) ? products : []);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Failed to load products');
        this.isLoading$.set(false);
        return of([]);
      })
    );
  }

  createProduct(dto: CreateProductDto, imageFile?: File): Observable<BackendProduct> {
    this.isLoading$.set(true);
    this.error$.set(null);
    const form = new FormData();
    form.append('name', dto.name);
    form.append('description', dto.description || '');
    form.append('price', dto.price);
    form.append('stockQuantity', String(dto.stockQuantity));
    form.append('status', dto.status || 'AVAILABLE');
    if (imageFile) {
      form.append('image', imageFile);
    }
    return this.api.post<BackendProduct>('/store/admin/products', form).pipe(
      tap(product => {
        this.products$.update(prev => [product, ...prev]);
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.error || error?.error?.message || 'Create failed');
        this.isLoading$.set(false);
        return throwError(() => error);
      })
    );
  }

  updateProduct(id: string, dto: CreateProductDto): Observable<BackendProduct> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.put<BackendProduct>(`/store/admin/products/${id}`, dto).pipe(
      tap(updated => {
        this.products$.update(products => products.map(p => p.id === updated.id ? updated : p));
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Update failed');
        this.isLoading$.set(false);
        return throwError(() => error);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.delete<void>(`/store/admin/products/${id}`).pipe(
      tap(() => {
        this.products$.update(products => products.filter(p => p.id !== id));
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Delete failed');
        this.isLoading$.set(false);
        return throwError(() => error);
      })
    );
  }

  updateStatus(id: string, status: string): Observable<BackendProduct> {
    this.isLoading$.set(true);
    this.error$.set(null);
    return this.api.patch<BackendProduct>(`/store/admin/products/${id}/status`, { status }).pipe(
      tap(updated => {
        this.products$.update(products => products.map(p => p.id === updated.id ? updated : p));
        this.isLoading$.set(false);
      }),
      catchError(error => {
        this.error$.set(error?.error?.message || 'Status update failed');
        this.isLoading$.set(false);
        return throwError(() => error);
      })
    );
  }

  getImageUrl(productId: string): string {
    return `${environment.apiUrl}/store/products/${productId}/image`;
  }
}
