import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MembershipService } from '../../services/membership.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Subscription } from '../../models/subscription.model';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';

@Component({
  standalone: true,
  selector: 'app-my-membership',
  imports: [RouterLink, DashboardMenuComponent, StatusBadgeComponent, LoadingButtonComponent],
  templateUrl: './my-membership.component.html',
  styleUrl: './my-membership.component.css'
})
export class MyMembershipComponent implements OnInit {

  isLoading    = signal(true);
  subscription = signal<Subscription | null>(null);
  errorMessage = signal<string | null>(null);

  private readonly membershipService = inject(MembershipService);
  private readonly tokenService      = inject(TokenService);
  private readonly toastService      = inject(ToastService);
  private readonly errorService      = inject(ErrorService);
  private readonly router            = inject(Router);
  private readonly destroyRef        = inject(DestroyRef);

  ngOnInit(): void {
    const role = this.tokenService.getRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    if (role === 'COACH') {
      this.router.navigate(['/home']);
      return;
    }
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.membershipService.getCurrentSubscription().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.isLoading.set(false);
      },
      error: (err) => {
        const isServerError = err instanceof HttpErrorResponse && err.status >= 500;
        const msg = isServerError
          ? 'Unable to load your membership. Please try again.'
          : this.errorService.extractMessage(err);
        this.errorMessage.set(msg);
        this.toastService.error(msg);
        this.isLoading.set(false);
      }
    });
  }

  isFree(): boolean {
    const price = this.subscription()?.planPrice;
    return price === null || price === 0;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  onCancel(): void {}
  onPause(): void {}
  onResume(): void {}
  onRenew(): void {}
  onChangePlan(): void {}
}
