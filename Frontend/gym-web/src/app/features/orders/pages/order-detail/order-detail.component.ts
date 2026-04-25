import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, timer } from 'rxjs';
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
  private readonly destroyRef   = inject(DestroyRef);

  order     = this.orderService.selectedOrder$;
  isLoading = this.orderService.isLoading$;
  private paymentPollSub: Subscription | null = null;

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const id = params['id'] as string;
      if (!id) return;

      this.paymentPollSub?.unsubscribe();
      this.orderService.getOrder(id).subscribe({
        next: () => this.maybeStartPolling(id)
      });
    });
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

  getStatusIconClass(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'orange';
      case 'PROCESSING':
      case 'CONFIRMED':
      case 'DELIVERED':
        return 'teal';
      case 'SHIPPED':
        return 'purple';
      case 'PAYMENT_FAILED':
      case 'PAYMENT_EXPIRED':
      case 'CANCELLED':
        return 'red';
      default:
        return 'orange';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'feather-clock';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'feather-check-circle';
      case 'SHIPPED':
        return 'feather-truck';
      case 'DELIVERED':
        return 'feather-package';
      case 'PAYMENT_FAILED':
        return 'feather-alert-circle';
      case 'PAYMENT_EXPIRED':
      case 'CANCELLED':
        return 'feather-x-circle';
      default:
        return 'feather-help-circle';
    }
  }

  get paymentStateMessage(): string | null {
    const status = this.order()?.status;
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Your payment is being processed. This page will update automatically once the order is confirmed.';
      case 'PAYMENT_FAILED':
        return 'Your payment could not be confirmed. The order was not processed.';
      case 'PAYMENT_EXPIRED':
        return 'Your payment attempt expired before confirmation arrived. The order was not processed.';
      case 'PROCESSING':
        return 'Your payment was confirmed and your order has been placed successfully.';
      default:
        return null;
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

  private maybeStartPolling(orderId: string): void {
    if (this.order()?.status !== 'PENDING_PAYMENT') {
      this.paymentPollSub?.unsubscribe();
      this.paymentPollSub = null;
      return;
    }

    this.paymentPollSub?.unsubscribe();
    this.paymentPollSub = timer(3000, 3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.orderService.getOrder(orderId).subscribe({
          next: order => {
            if (order.status !== 'PENDING_PAYMENT') {
              this.paymentPollSub?.unsubscribe();
              this.paymentPollSub = null;
            }
          },
          error: () => undefined
        });
      });
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
