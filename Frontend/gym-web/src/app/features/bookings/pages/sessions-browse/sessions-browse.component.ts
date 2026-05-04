import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, take } from 'rxjs';

import { BookingService } from '../../services/booking.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastService } from '../../../../core/services/toast.service';
import { SessionResponse } from '../../models/session.model';
import { SessionStatus } from '../../models/session-status.enum';

@Component({
  selector: 'app-sessions-browse',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './sessions-browse.component.html',
  styleUrl: './sessions-browse.component.css'
})
export class SessionsBrowseComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly toastService   = inject(ToastService);
  private readonly destroyRef     = inject(DestroyRef);

  sessions      = signal<SessionResponse[]>([]);
  isLoading     = signal(true);
  errorMessage  = signal<string | null>(null);
  currentPage   = signal(1);
  totalItems    = signal(0);
  totalPages    = signal(0);
  bookingInProgress = signal<string | null>(null);
  bookingEligible = signal(true);
  bookingEligibilityReason = signal<string | null>(null);

  readonly pageSize = 6;
  readonly availableSessions = computed(() =>
    this.sessions().filter(session => this.isSessionOpen(session)).length
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
  readonly nextSessionLabel = computed(() => {
    const first = this.sessions()[0];
    return first ? new Date(first.startTime).toLocaleDateString() : 'No upcoming slot';
  });

  readonly SessionStatus = SessionStatus;

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      sessions: this.bookingService.getSessions(this.currentPage(), this.pageSize),
      eligibility: this.bookingService.getBookingEligibility().pipe(
        catchError(() => of({ allowed: true, reason: null }))
      )
    })
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMessage.set('Failed to load sessions. Please try again.');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe(result => {
        if (!result) return;
        this.sessions.set(result.sessions.items);
        this.totalItems.set(result.sessions.total);
        this.totalPages.set(result.sessions.totalPages);
        this.currentPage.set(result.sessions.page);
        this.bookingEligible.set(result.eligibility.allowed);
        this.bookingEligibilityReason.set(result.eligibility.reason);
        this.isLoading.set(false);
      });
  }

  book(sessionId: string): void {
    if (this.bookingInProgress()) return;
    this.bookingInProgress.set(sessionId);

    this.bookingService.bookSession(sessionId)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          const msg = err?.error?.error ?? 'Could not complete booking.';
          this.toastService.error(msg);
          this.bookingInProgress.set(null);
          return of(null);
        })
      )
      .subscribe(result => {
        if (!result) return;
        this.toastService.success('Session booked successfully!');
        this.bookingInProgress.set(null);
      });
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadSessions();
  }

  canBook(session: SessionResponse): boolean {
    return this.bookingEligible() && this.isSessionOpen(session);
  }

  isSessionOpen(session: SessionResponse): boolean {
    return session.status === SessionStatus.OPEN && !session.isFull;
  }

  actionLabel(session: SessionResponse): string {
    if (this.bookingInProgress() === session.id) {
      return 'Booking...';
    }

    if (!this.bookingEligible()) {
      return 'Upgrade to Unlock';
    }

    if (session.isFull) {
      return 'Session Full';
    }

    switch (session.status) {
      case SessionStatus.CLOSED:
        return 'Session Closed';
      case SessionStatus.CANCELLED:
        return 'Session Cancelled';
      default:
        return 'Book Now';
    }
  }
}
