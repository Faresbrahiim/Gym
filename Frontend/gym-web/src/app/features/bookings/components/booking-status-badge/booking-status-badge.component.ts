import { Component, Input } from '@angular/core';
import { BookingStatus } from '../../models/booking-status.enum';

@Component({
  selector: 'app-booking-status-badge',
  standalone: true,
  templateUrl: './booking-status-badge.component.html'
})
export class BookingStatusBadgeComponent {
  @Input({ required: true }) status!: BookingStatus;

  get badgeClass(): string {
    switch (this.status) {
      case BookingStatus.ACCEPTED:  return 'badge bg-success';
      case BookingStatus.PENDING:   return 'badge bg-warning text-dark';
      case BookingStatus.DECLINED:  return 'badge bg-danger';
      case BookingStatus.CANCELLED: return 'badge bg-secondary';
      default:                      return 'badge bg-secondary';
    }
  }

  get iconClass(): string {
    switch (this.status) {
      case BookingStatus.ACCEPTED:  return 'feather-check-circle';
      case BookingStatus.PENDING:   return 'feather-loader';
      case BookingStatus.DECLINED:  return 'feather-x-circle';
      case BookingStatus.CANCELLED: return 'feather-slash';
      default:                      return '';
    }
  }

  get label(): string {
    switch (this.status) {
      case BookingStatus.ACCEPTED:  return 'Accepted';
      case BookingStatus.PENDING:   return 'Pending';
      case BookingStatus.DECLINED:  return 'Declined';
      case BookingStatus.CANCELLED: return 'Cancelled';
      default:                      return String(this.status);
    }
  }
}
