import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly route        = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  order     = this.orderService.selectedOrder$;
  isLoading = this.orderService.isLoading$;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'] as string;
      if (id) this.orderService.getOrder(id).subscribe();
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':   return 'badge-warning';
      case 'CONFIRMED': return 'badge-info';
      case 'SHIPPED':   return 'badge-primary';
      case 'DELIVERED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      default:          return 'badge-secondary';
    }
  }

  getStatusIconClass(status: string): string {
    switch (status) {
      case 'PENDING':   return 'orange';
      case 'CONFIRMED': return 'teal';
      case 'SHIPPED':   return 'purple';
      case 'DELIVERED': return 'teal';
      case 'CANCELLED': return 'red';
      default:          return 'orange';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':   return 'feather-clock';
      case 'CONFIRMED': return 'feather-check-circle';
      case 'SHIPPED':   return 'feather-truck';
      case 'DELIVERED': return 'feather-package';
      case 'CANCELLED': return 'feather-x-circle';
      default:          return 'feather-help-circle';
    }
  }

  onCancelOrder(): void {
    const ord = this.order();
    if (!ord || !confirm('Cancel this order?')) return;
    this.orderService.cancelOrder(ord.id).subscribe({
      next:  () => this.toastService.success('Order cancelled'),
      error: () => this.toastService.error('Failed to cancel order')
    });
  }
}
