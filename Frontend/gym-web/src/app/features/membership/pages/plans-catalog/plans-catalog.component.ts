import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PlanService } from '../../services/plan.service';
import { MembershipService } from '../../services/membership.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Plan } from '../../models/plan.model';
import { SubscriptionStatus } from '../../models/subscription-status.enum';
import { ACTIVE_STATUSES } from '../../models/subscription-status.enum';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'app-plans-catalog',
  imports: [RouterLink, PlanCardComponent, PageHeaderComponent],
  templateUrl: './plans-catalog.component.html',
  styleUrl: './plans-catalog.component.css'
})
export class PlansCatalogComponent implements OnInit {

  isLoading    = signal(true);
  plans        = signal<Plan[]>([]);
  currentPlanId = signal<string | null>(null);
  currentPlanPrice = signal<number | null>(null);
  currentSubscriptionStatus = signal<SubscriptionStatus | null>(null);
  errorMessage = signal<string | null>(null);

  private readonly planService      = inject(PlanService);
  private readonly membershipService = inject(MembershipService);
  private readonly tokenService     = inject(TokenService);
  private readonly toastService     = inject(ToastService);
  private readonly errorService     = inject(ErrorService);
  private readonly router           = inject(Router);
  private readonly destroyRef       = inject(DestroyRef);

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
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const isAuth = this.tokenService.isAuthenticated();
    const subs$ = isAuth
      ? this.membershipService.getMySubscriptions().pipe(catchError(() => of([])))
      : of([]);

    forkJoin({ plans: this.planService.getActivePlans(), subs: subs$ }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ plans, subs }) => {
        this.plans.set(
          plans
            .filter((p: Plan) => p.price !== null && p.price > 0)
            .sort((left, right) => left.price - right.price)
        );
        const activeSub = subs.find((s: any) => ACTIVE_STATUSES.includes(s.status)) ?? null;
        this.currentPlanId.set(activeSub?.planId ?? null);
        this.currentPlanPrice.set(activeSub?.planPrice ?? null);
        this.currentSubscriptionStatus.set(activeSub?.status ?? null);
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = this.errorService.extractMessage(err);
        this.errorMessage.set(msg);
        this.toastService.error(msg);
        this.isLoading.set(false);
      }
    });
  }

  onSelectPlan(planId: string): void {
    const selectedPlan = this.plans().find(plan => plan.id === planId);
    const selectionBlockedReason = selectedPlan ? this.getSelectionBlockedReason(selectedPlan) : this.planChangeBlockedReason;

    if (selectionBlockedReason) {
      this.toastService.error(selectionBlockedReason);
      return;
    }

    if (this.tokenService.isAuthenticated()) {
      this.router.navigate(['/membership/checkout', planId]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/membership/checkout/${planId}` }
      });
    }
  }

  get planChangeBlockedReason(): string | null {
    return this.getPlanChangeBlockedReason(this.currentSubscriptionStatus());
  }

  getSelectionBlockedReason(plan: Plan): string | null {
    const stateBlock = this.planChangeBlockedReason;
    if (stateBlock) {
      return stateBlock;
    }

    const currentPrice = this.currentPlanPrice();
    if (currentPrice !== null && currentPrice > 0 && plan.id !== this.currentPlanId()) {
      return 'Self-service plan changes between paid plans are not available right now.';
    }

    return null;
  }

  get paidPlanSwitchBlockedReason(): string | null {
    const currentPrice = this.currentPlanPrice();
    if (currentPrice !== null && currentPrice > 0 && !this.planChangeBlockedReason) {
      return 'You can keep your current paid membership, but switching between paid plans is not available right now.';
    }

    return null;
  }

  private getPlanChangeBlockedReason(status: SubscriptionStatus | null): string | null {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Plan changes are unavailable while your payment is still pending.';
      case 'PAYMENT_FAILED':
        return 'Resolve the payment issue before changing your plan.';
      case 'PAUSED':
        return 'Resume your membership before changing plans.';
      case 'FROZEN':
        return 'Plan changes are unavailable while your membership is frozen.';
      default:
        return null;
    }
  }
}
