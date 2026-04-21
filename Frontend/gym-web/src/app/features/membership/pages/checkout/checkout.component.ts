import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { PlanService } from '../../services/plan.service';
import { MembershipService } from '../../services/membership.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Plan } from '../../models/plan.model';
import { Subscription } from '../../models/subscription.model';
import { ACTIVE_STATUSES } from '../../models/subscription-status.enum';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [RouterLink, DashboardMenuComponent, LoadingButtonComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  isLoading    = signal(true);
  isSubmitting = signal(false);
  plan         = signal<Plan | null>(null);
  errorMessage = signal<string | null>(null);

  private currentSub: Subscription | null = null;
  private planId = '';

  private readonly route             = inject(ActivatedRoute);
  private readonly router            = inject(Router);
  private readonly planService       = inject(PlanService);
  private readonly membershipService = inject(MembershipService);
  private readonly toastService      = inject(ToastService);
  private readonly errorService      = inject(ErrorService);
  private readonly destroyRef        = inject(DestroyRef);

  ngOnInit(): void {
    this.planId = this.route.snapshot.paramMap.get('planId') ?? '';
    if (!this.planId) {
      this.router.navigate(['/membership/plans']);
      return;
    }

    forkJoin({
      plan: this.planService.getPlan(this.planId),
      subs: this.membershipService.getMySubscriptions()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ plan, subs }) => {
        this.plan.set(plan);
        this.currentSub = subs.find(s => ACTIVE_STATUSES.includes(s.status)) ?? null;

        if (this.currentSub?.planId === this.planId) {
          this.toastService.success("You're already on this plan.");
          this.router.navigate(['/membership']);
          return;
        }

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

  get isChangingPlan(): boolean {
    return this.currentSub !== null && this.currentSub.planId !== this.planId;
  }

  get isFree(): boolean {
    const p = this.plan();
    return p !== null && p.price === 0;
  }

  get formattedPrice(): string {
    const p = this.plan();
    if (!p) return '';
    if (this.isFree) return 'Free';
    return `$${p.price.toFixed(2)}`;
  }

  get durationLabel(): string {
    const p = this.plan();
    if (!p || !p.durationInDays || p.durationInDays === 0) return 'Unlimited';
    if (p.durationInDays % 365 === 0) return `${p.durationInDays / 365} year${p.durationInDays / 365 > 1 ? 's' : ''}`;
    if (p.durationInDays % 30 === 0) return `${p.durationInDays / 30} month${p.durationInDays / 30 > 1 ? 's' : ''}`;
    return `${p.durationInDays} days`;
  }

  get buttonLabel(): string {
    if (this.isChangingPlan) return `Switch to ${this.plan()?.name}`;
    if (this.isFree) return 'Activate Free Plan';
    return `Subscribe — ${this.formattedPrice}`;
  }

  onConfirm(): void {
    const p = this.plan();
    if (!p || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const action$ = this.isChangingPlan
      ? this.membershipService.changePlan(this.currentSub!.subscriptionId, p.id)
      : this.membershipService.create(p.id);

    action$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (sub) => {
        const msg = this.isChangingPlan ? 'Plan changed successfully!' : 'Membership activated!';
        this.toastService.success(msg);
        this.router.navigate(['/membership/status', sub.subscriptionId]);
      },
      error: (err) => {
        const msg = this.errorService.extractMessage(err);
        this.toastService.error(msg);
        this.isSubmitting.set(false);
      }
    });
  }
}
