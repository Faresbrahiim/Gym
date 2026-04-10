import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  standalone: true,
  selector: 'app-orders-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = this.orderService.orders$;
  isLoading = this.orderService.isLoading$;
  currentPage = 1;
  itemsPerPage = 10;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders(this.currentPage, this.itemsPerPage).subscribe();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'CONFIRMED':
        return 'badge-info';
      case 'SHIPPED':
        return 'badge-primary';
      case 'DELIVERED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}
