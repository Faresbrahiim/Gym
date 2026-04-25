import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductAdminService, BackendProduct, CreateProductDto } from '../../services/product-admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-admin-products-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products-list.component.html',
  styleUrl: './admin-products-list.component.css'
})
export class AdminProductsListComponent implements OnInit {
  private readonly productAdminService = inject(ProductAdminService);
  private readonly toastService        = inject(ToastService);

  products  = this.productAdminService.products$;
  isLoading = this.productAdminService.isLoading$;
  error     = this.productAdminService.error$;

  showCreateModal  = false;
  editingProduct: BackendProduct | null = null;
  selectedFile: File | null = null;
  updatingStatusId: string | null = null;

  newProduct: CreateProductDto = { name: '', description: '', price: '', status: 'AVAILABLE' };
  editForm:   CreateProductDto = { name: '', description: '', price: '', status: 'AVAILABLE' };

  readonly DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Crect width="50" height="50" fill="%23f0f0f0"/%3E%3Ctext x="25" y="25" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

  ngOnInit(): void {
    this.productAdminService.getAllProducts().subscribe();
  }

  formatPrice(price: string): string {
    return parseFloat(price).toFixed(2);
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getImageUrl(product: BackendProduct): string {
    if (!product.imagePath) return this.DEFAULT_IMAGE;
    return this.productAdminService.getImageUrl(product.id);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.DEFAULT_IMAGE;
  }

  updateProductStatus(product: BackendProduct, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.updatingStatusId = product.id;
    this.productAdminService.updateStatus(product.id, newStatus).subscribe({
      next:  () => {
        this.updatingStatusId = null;
        this.toastService.success('Status updated');
      },
      error: (err) => {
        this.updatingStatusId = null;
        const msg = err.error?.error || err.error?.message || 'Failed to update status';
        this.toastService.error(msg);
        const sel = document.querySelector(`select[data-product-id="${product.id}"]`) as HTMLSelectElement;
        if (sel) sel.value = product.status;
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newProduct = { name: '', description: '', price: '', status: 'AVAILABLE' };
    this.selectedFile = null;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.selectedFile = null;
  }

  createProduct(): void {
    if (!this.newProduct.name || !this.newProduct.price) {
      this.toastService.error('Name and price are required');
      return;
    }
    this.productAdminService.createProduct(this.newProduct, this.selectedFile ?? undefined).subscribe({
      next:  () => {
        this.closeCreateModal();
        this.toastService.success('Product created');
      },
      error: (err) => {
        this.toastService.error(err.error?.error || err.error?.message || 'Failed to create product');
      },
    });
  }

  startEdit(product: BackendProduct): void {
    this.editingProduct = product;
    this.editForm = { name: product.name, description: product.description || '', price: product.price, status: product.status };
  }

  cancelEdit(): void { this.editingProduct = null; }

  saveEdit(): void {
    if (!this.editingProduct) return;
    this.productAdminService.updateProduct(this.editingProduct.id, this.editForm).subscribe({
      next:  () => {
        this.cancelEdit();
        this.toastService.success('Product updated');
      },
      error: (err) => {
        this.toastService.error(err.error?.message || err.error?.error || 'Failed to update product');
      },
    });
  }

  deleteProduct(product: BackendProduct): void {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.productAdminService.deleteProduct(product.id).subscribe({
      next:  () => this.toastService.success('Product deleted'),
      error: (err) => this.toastService.error(err.error?.message || 'Failed to delete'),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  trackByProductId(_: number, product: BackendProduct): string {
    return product.id;
  }
}
