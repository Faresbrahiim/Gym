import { Component, Input } from '@angular/core';
import { PaymentStatus } from '../../models/payment-status.enum';

@Component({
  selector: 'app-payment-status-badge',
  standalone: true,
  templateUrl: './payment-status-badge.component.html',
  styleUrl: './payment-status-badge.component.css'
})
export class PaymentStatusBadgeComponent {
  @Input({ required: true }) status!: PaymentStatus;

  get badgeClass(): string {
    switch (this.status) {
      case PaymentStatus.COMPLETED: return 'badge bg-success';
      case PaymentStatus.PENDING:   return 'badge bg-warning text-dark';
      case PaymentStatus.FAILED:    return 'badge bg-danger';
      case PaymentStatus.REFUNDED:  return 'badge bg-info text-dark';
      default:                      return 'badge bg-secondary';
    }
  }

  get iconClass(): string {
    switch (this.status) {
      case PaymentStatus.COMPLETED: return 'feather-check-square';
      case PaymentStatus.PENDING:   return 'feather-loader';
      case PaymentStatus.FAILED:    return 'feather-alert-circle';
      case PaymentStatus.REFUNDED:  return 'feather-rotate-ccw';
      default:                      return '';
    }
  }

  get label(): string {
    switch (this.status) {
      case PaymentStatus.COMPLETED: return 'Completed';
      case PaymentStatus.PENDING:   return 'Pending';
      case PaymentStatus.FAILED:    return 'Failed';
      case PaymentStatus.REFUNDED:  return 'Refunded';
      default:                      return String(this.status);
    }
  }
}
