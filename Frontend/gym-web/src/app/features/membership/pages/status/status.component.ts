import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { MembershipService } from '../../services/membership.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Subscription } from '../../models/subscription.model';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_DURATION_MS = 150000;
const MAX_POLL_ATTEMPTS = Math.ceil(MAX_POLL_DURATION_MS / POLL_INTERVAL_MS);

@Component({
  standalone: true,
  selector: 'app-status',
  imports: [RouterLink, DashboardMenuComponent, StatusBadgeComponent, PageHeaderComponent],
  templateUrl: './status.component.html',
  styleUrl: './status.component.css'
})
export class StatusComponent implements OnInit {

  isLoading    = signal(true);
  subscription = signal<Subscription | null>(null);
  timedOut     = signal(false);
  attemptExpiredKeepingCurrentPlan = signal(false);

  private subscriptionId = '';
  private expectedPlanId: string | null = null;
  private attempts       = 0;
  private readonly stop$ = new Subject<void>();

  private readonly route             = inject(ActivatedRoute);
  private readonly router            = inject(Router);
  private readonly membershipService = inject(MembershipService);
  private readonly toastService      = inject(ToastService);
  private readonly destroyRef        = inject(DestroyRef);

  ngOnInit(): void {
    this.subscriptionId = this.route.snapshot.paramMap.get('subscriptionId') ?? '';
    this.expectedPlanId = this.route.snapshot.queryParamMap.get('expectedPlanId');
    if (!this.subscriptionId) {
      this.router.navigate(['/membership']);
      return;
    }
    this.poll();
  }

  private poll(): void {
    timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.membershipService.getMySubscriptions()),
      takeUntil(this.stop$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (subs) => {
        this.attempts++;
        const sub = subs.find(s => s.subscriptionId === this.subscriptionId) ?? null;
        this.subscription.set(sub);
        this.isLoading.set(false);

        if (sub?.status === 'ACTIVE') {
          if (this.expectedPlanId && sub.planId !== this.expectedPlanId) {
            this.attemptExpiredKeepingCurrentPlan.set(true);
            this.toastService.error('The payment attempt expired. Your current membership was kept unchanged.');
            this.stop$.next();
            return;
          }

          this.toastService.success('Your membership is now active!');
          this.stop$.next();
          return;
        }

        if (sub?.status === 'PAYMENT_FAILED') {
          this.toastService.error('Payment failed. Please try again.');
          this.stop$.next();
          return;
        }

        if (this.attempts >= MAX_POLL_ATTEMPTS) {
          this.timedOut.set(true);
          this.stop$.next();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.stop$.next();
      }
    });
  }

  get planId(): string {
    return this.subscription()?.planId ?? '';
  }

  get expectedPlanNameMismatch(): boolean {
    const sub = this.subscription();
    return !!(sub && this.expectedPlanId && sub.planId !== this.expectedPlanId);
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return iso; }
  }
}
