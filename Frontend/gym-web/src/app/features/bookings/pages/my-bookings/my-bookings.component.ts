import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, take } from 'rxjs';

import { BookingService } from '../../services/booking.service';
import { MemberBookingResponse } from '../../models/booking.model';
import { BookingStatus } from '../../models/booking-status.enum';
import { BookingStatusBadgeComponent } from '../../components/booking-status-badge/booking-status-badge.component';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { PaginationBarComponent } from '../../../../shared/components/pagination-bar/pagination-bar.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, BookingStatusBadgeComponent, DashboardMenuComponent, PaginationBarComponent],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css'
})
export class MyBookingsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly destroyRef     = inject(DestroyRef);

  bookings      = signal<MemberBookingResponse[]>([]);
  isLoading     = signal(true);
  errorMessage  = signal<string | null>(null);
  currentPage   = signal(1);
  totalItems    = signal(0);
  totalPages    = signal(0);

  readonly pageSize = 10;
  readonly pendingCount = computed(() =>
    this.bookings().filter(booking => booking.status === BookingStatus.PENDING).length
  );
  readonly acceptedCount = computed(() =>
    this.bookings().filter(booking => booking.status === BookingStatus.ACCEPTED).length
  );
  readonly declinedCount = computed(() =>
    this.bookings().filter(booking => booking.status === BookingStatus.DECLINED).length
  );

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookingService.getMyBookings(this.currentPage(), this.pageSize)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMessage.set('Failed to load your bookings. Please try again.');
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

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadBookings();
  }
}
