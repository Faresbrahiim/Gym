import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, take } from 'rxjs';

import { BookingService } from '../../services/booking.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CoachBookingResponse } from '../../models/booking.model';
import { BookingStatus } from '../../models/booking-status.enum';
import { BookingStatusBadgeComponent } from '../../components/booking-status-badge/booking-status-badge.component';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-coach-session-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, BookingStatusBadgeComponent, DashboardMenuComponent, PageHeaderComponent],
  templateUrl: './coach-session-bookings.component.html',
  styleUrl: './coach-session-bookings.component.css'
})
export class CoachSessionBookingsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly toastService   = inject(ToastService);
  private readonly route          = inject(ActivatedRoute);
  private readonly destroyRef     = inject(DestroyRef);

  sessionId     = signal('');
  bookings      = signal<CoachBookingResponse[]>([]);
  isLoading     = signal(true);
  errorMessage  = signal<string | null>(null);
  currentPage   = signal(1);
  totalItems    = signal(0);
  totalPages    = signal(0);
  actionInProgress = signal<string | null>(null);

  readonly pageSize    = 10;
  readonly BookingStatus = BookingStatus;
  readonly pendingCount = computed(() =>
    this.bookings().filter(booking => booking.status === BookingStatus.PENDING).length
  );
  readonly acceptedCount = computed(() =>
    this.bookings().filter(booking => booking.status === BookingStatus.ACCEPTED).length
  );
  readonly declinedCount = computed(() =>
    this.bookings().filter(booking => booking.status === BookingStatus.DECLINED).length
  );
  readonly pageNumbers = computed(() =>
    Array.from({ length: Math.max(this.totalPages(), 1) }, (_, index) => index + 1)
  );
  readonly firstVisibleItem = computed(() =>
    this.totalItems() === 0 ? 0 : ((this.currentPage() - 1) * this.pageSize) + 1
  );
  readonly lastVisibleItem = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.totalItems())
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sessionId') ?? '';
    this.sessionId.set(id);
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookingService.getSessionBookings(this.sessionId(), this.currentPage(), this.pageSize)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMessage.set('Failed to load bookings. Please try again.');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.bookings.set(data.items);
        this.totalItems.set(data.total);
        this.totalPages.set(data.totalPages);
        this.currentPage.set(data.page);
        this.isLoading.set(false);
      });
  }

  accept(bookingId: string): void {
    if (this.actionInProgress()) return;
    this.actionInProgress.set(bookingId);

    this.bookingService.acceptBooking(bookingId)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          const msg = err?.error?.error ?? 'Could not accept booking.';
          this.toastService.error(msg);
          this.actionInProgress.set(null);
          return of(null);
        })
      )
      .subscribe(updated => {
        if (!updated) return;
        this.bookings.update(list =>
          list.map(b => b.id === bookingId ? { ...b, status: updated.status } : b)
        );
        this.toastService.success('Booking accepted.');
        this.actionInProgress.set(null);
      });
  }

  decline(bookingId: string): void {
    if (this.actionInProgress()) return;
    this.actionInProgress.set(bookingId);

    this.bookingService.declineBooking(bookingId)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          const msg = err?.error?.error ?? 'Could not decline booking.';
          this.toastService.error(msg);
          this.actionInProgress.set(null);
          return of(null);
        })
      )
      .subscribe(updated => {
        if (!updated) return;
        this.bookings.update(list =>
          list.map(b => b.id === bookingId ? { ...b, status: updated.status } : b)
        );
        this.toastService.error('Booking declined.');
        this.actionInProgress.set(null);
      });
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadBookings();
  }
}
