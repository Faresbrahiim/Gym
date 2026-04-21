import { Component, Input } from '@angular/core';
import { SubscriptionStatus } from '../../models/subscription-status.enum';

@Component({
  standalone: true,
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: SubscriptionStatus;

  get badgeClass(): string {
    switch (this.status) {
      case 'ACTIVE':           return 'badge bg-success';
      case 'PENDING_PAYMENT':  return 'badge bg-warning text-dark';
      case 'PAYMENT_FAILED':   return 'badge bg-danger';
      case 'PAUSED':           return 'badge bg-secondary';
      case 'FROZEN':           return 'badge bg-secondary';
      case 'CANCELLED':        return 'badge bg-secondary';
      case 'EXPIRED':          return 'badge bg-secondary';
      case 'PAUSE_REQUESTED':  return 'badge bg-info text-dark';
      case 'CANCEL_REQUESTED': return 'badge bg-info text-dark';
      case 'UPGRADED':         return 'badge bg-info text-dark';
      case 'DOWNGRADED':       return 'badge bg-info text-dark';
      default:                 return 'badge bg-secondary';
    }
  }

  get label(): string {
    switch (this.status) {
      case 'ACTIVE':           return 'Active';
      case 'PENDING_PAYMENT':  return 'Pending Payment';
      case 'PAYMENT_FAILED':   return 'Payment Failed';
      case 'PAUSED':           return 'Paused';
      case 'FROZEN':           return 'Frozen';
      case 'CANCELLED':        return 'Cancelled';
      case 'EXPIRED':          return 'Expired';
      case 'PAUSE_REQUESTED':  return 'Pause Requested';
      case 'CANCEL_REQUESTED': return 'Cancel Requested';
      case 'UPGRADED':         return 'Upgraded';
      case 'DOWNGRADED':       return 'Downgraded';
      default:                 return this.status;
    }
  }
}
