import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';

@Component({
  standalone: true,
  selector: 'app-orders-list',
  imports: [CommonModule, RouterLink, DashboardMenuComponent],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  orders    = this.orderService.orders$;
  isLoading = this.orderService.isLoading$;
  errorMessage = this.orderService.error$;

  ngOnInit(): void {
    this.orderService.getOrders().subscribe();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'badge-warning';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'badge-info';
      case 'SHIPPED':
        return 'badge-primary';
      case 'DELIVERED':
        return 'badge-success';
      case 'PAYMENT_FAILED':
      case 'PAYMENT_EXPIRED':
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusDisplayLabel(status: string): string {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Awaiting Payment';
      case 'PAYMENT_FAILED':
        return 'Payment Failed';
      case 'PAYMENT_EXPIRED':
        return 'Payment Expired';
      case 'PROCESSING':
        return 'Confirmed';
      default:
        return this.toTitleCase(status);
    }
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
