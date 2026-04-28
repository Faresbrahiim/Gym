import { Component, OnInit, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, take } from 'rxjs';

import { BookingService } from '../../services/booking.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SessionResponse } from '../../models/session.model';
import { SessionStatus } from '../../models/session-status.enum';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';

@Component({
  selector: 'app-coach-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DashboardMenuComponent],
  templateUrl: './coach-sessions.component.html',
  styleUrl: './coach-sessions.component.css'
})
export class CoachSessionsComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly toastService   = inject(ToastService);
  private readonly fb             = inject(FormBuilder);
  private readonly destroyRef     = inject(DestroyRef);

  sessions      = signal<SessionResponse[]>([]);
  isLoading     = signal(true);
  errorMessage  = signal<string | null>(null);
  currentPage   = signal(1);
  totalItems    = signal(0);
  totalPages    = signal(0);
  isSubmitting  = signal(false);
  showModal     = signal(false);

  readonly pageSize = 10;
  readonly SessionStatus = SessionStatus;
  readonly openCount = computed(() =>
    this.sessions().filter(session => session.status === SessionStatus.OPEN).length
  );
  readonly totalCapacity = computed(() =>
    this.sessions().reduce((sum, session) => sum + session.maxParticipants, 0)
  );
  readonly upcomingCount = computed(() =>
    this.sessions().filter(session => new Date(session.startTime).getTime() > Date.now()).length
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

  form!: FormGroup;

  private readonly sessionTimeOrderValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;

    if (!startTime || !endTime) {
      return null;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    return end > start ? null : { invalidTimeRange: true };
  };

  ngOnInit(): void {
    this.form = this.fb.group({
      title:           ['', [Validators.required, Validators.maxLength(255)]],
      description:     [''],
      startTime:       ['', Validators.required],
      endTime:         ['', Validators.required],
      maxParticipants: [null, [Validators.required, Validators.min(1), Validators.max(100)]]
    }, { validators: this.sessionTimeOrderValidator });
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookingService.getCoachSessions(this.currentPage(), this.pageSize)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMessage.set('Failed to load your sessions. Please try again.');
          this.isLoading.set(false);
          return of(null);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.sessions.set(data.items);
        this.totalItems.set(data.total);
        this.totalPages.set(data.totalPages);
        this.currentPage.set(data.page);
        this.isLoading.set(false);
      });
  }

  openModal(): void {
    this.form.reset();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const { title, description, startTime, endTime, maxParticipants } = this.form.value;

    this.bookingService.createSession({
      title: title.trim(),
      description: description?.trim() || null,
      startTime: new Date(startTime).toISOString(),
      endTime:   new Date(endTime).toISOString(),
      maxParticipants: Number(maxParticipants)
    })
    .pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        const msg = err?.error?.error ?? 'Could not create session.';
        this.toastService.error(msg);
        this.isSubmitting.set(false);
        return of(null);
      })
    )
    .subscribe(result => {
      if (!result) return;
      this.toastService.success('Session created successfully!');
      this.isSubmitting.set(false);
      this.closeModal();
      this.currentPage.set(1);
      this.loadSessions();
    });
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadSessions();
  }

  statusBadge(status: SessionStatus): string {
    switch (status) {
      case SessionStatus.OPEN:      return 'badge bg-success';
      case SessionStatus.CLOSED:    return 'badge bg-secondary';
      case SessionStatus.CANCELLED: return 'badge bg-danger';
      default:                      return 'badge bg-secondary';
    }
  }
}
