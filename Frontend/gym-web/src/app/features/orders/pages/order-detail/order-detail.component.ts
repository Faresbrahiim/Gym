import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  order = this.orderService.selectedOrder$;
  isLoading = this.orderService.isLoading$;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = parseInt(params['id']);
      if (id) {
        this.orderService.getOrder(id).subscribe();
      }
    });
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

  onCancelOrder(): void {
    const ord = this.order();
    if (ord && confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(ord.id).subscribe();
    }
  }
}
