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
import { ACTIVE_STATUSES } from '../../models/subscription-status.enum';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';

@Component({
  standalone: true,
  selector: 'app-plans-catalog',
  imports: [RouterLink, PlanCardComponent],
  templateUrl: './plans-catalog.component.html',
  styleUrl: './plans-catalog.component.css'
})
export class PlansCatalogComponent implements OnInit {

  isLoading    = signal(true);
  plans        = signal<Plan[]>([]);
  currentPlanId = signal<string | null>(null);
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
        this.plans.set(plans.filter((p: Plan) => p.price !== null && p.price > 0));
        const activeSub = subs.find((s: any) => ACTIVE_STATUSES.includes(s.status)) ?? null;
        this.currentPlanId.set(activeSub?.planId ?? null);
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
    if (this.tokenService.isAuthenticated()) {
      this.router.navigate(['/membership/checkout', planId]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/membership/checkout/${planId}` }
      });
    }
  }
}
