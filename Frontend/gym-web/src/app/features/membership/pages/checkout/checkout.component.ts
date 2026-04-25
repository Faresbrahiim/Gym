import { Component, OnInit, signal, inject, DestroyRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, firstValueFrom } from 'rxjs';
import { PlanService } from '../../services/plan.service';
import { MembershipService } from '../../services/membership.service';
import { PaymentService } from '../../../payments/services/payment.service';
import { StripeService } from '../../../payments/services/stripe.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Plan } from '../../models/plan.model';
import { Subscription } from '../../models/subscription.model';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { StripeCardComponent } from '../../../payments/components/stripe-card/stripe-card.component';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [RouterLink, DashboardMenuComponent, LoadingButtonComponent, StripeCardComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  @ViewChild(StripeCardComponent) stripeCard?: StripeCardComponent;

  isLoading = signal(true);
  isSubmitting = signal(false);
  plan = signal<Plan | null>(null);
  errorMessage = signal<string | null>(null);
  paymentErrorMessage = signal<string | null>(null);

  private currentActiveSub: Subscription | null = null;
  private planId = '';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planService = inject(PlanService);
  private readonly membershipService = inject(MembershipService);
  private readonly paymentService = inject(PaymentService);
  private readonly stripeService = inject(StripeService);
  private readonly toastService = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  private readonly destroyRef = inject(DestroyRef);

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

        const alreadyActive = subs.find(s => s.status === 'ACTIVE' && s.planId === this.planId);
        if (alreadyActive) {
          this.toastService.success("You're already on this plan.");
          this.router.navigate(['/membership']);
          return;
        }

        this.currentActiveSub = subs.find(s => s.status === 'ACTIVE' && s.planId !== this.planId) ?? null;

        if (this.currentActiveSub && (this.currentActiveSub.planPrice ?? 0) > 0) {
          this.toastService.error('Self-service plan changes between paid plans are not available right now.');
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
    return this.currentActiveSub !== null;
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
    if (this.isChangingPlan) return `Upgrade to ${this.plan()?.name}`;
    if (this.isFree) return 'Activate Free Plan';
    return `Subscribe - ${this.formattedPrice}`;
  }

  async onConfirm(): Promise<void> {
    const p = this.plan();
    if (!p || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.paymentErrorMessage.set(null);

    if (this.isFree) {
      try {
        const action$ = this.isChangingPlan
          ? this.membershipService.changePlan(this.currentActiveSub!.subscriptionId, p.id)
          : this.membershipService.create(p.id);
        const sub = await firstValueFrom(action$);
        this.toastService.success('Membership activated!');
        this.router.navigate(['/membership/status', sub.subscriptionId]);
      } catch (err) {
        this.toastService.error(this.errorService.extractMessage(err));
        this.isSubmitting.set(false);
      }
      return;
    }

    if (!this.stripeCard) {
      this.toastService.error('Payment form not loaded. Please refresh.');
      this.isSubmitting.set(false);
      return;
    }

    const { paymentMethod, error: pmError } = await this.stripeCard.createPaymentMethod();
    if (pmError || !paymentMethod) {
      this.paymentErrorMessage.set(pmError?.message || 'Invalid card details.');
      this.isSubmitting.set(false);
      return;
    }

    try {
      const subAction$ = this.isChangingPlan
        ? this.membershipService.changePlan(this.currentActiveSub!.subscriptionId, p.id)
        : this.membershipService.create(p.id);
      const sub = await firstValueFrom(subAction$);

      const res = await firstValueFrom(this.paymentService.initiatePayment({
        subscriptionId: sub.subscriptionId,
        planId: p.id,
        paymentMethodToken: paymentMethod.id
      }));

      const { error: confirmError } = await this.stripeService.confirmCardPayment(res.clientSecret);
      if (confirmError) {
        this.toastService.error('Payment confirmation failed. Please try again.');
        this.router.navigate(['/membership/status', sub.subscriptionId], {
          queryParams: { expectedPlanId: p.id }
        });
      } else {
        this.toastService.info('Payment received. We are finalizing your membership now.');
        this.router.navigate(['/membership/status', sub.subscriptionId], {
          queryParams: { expectedPlanId: p.id }
        });
      }
    } catch (err) {
      this.paymentErrorMessage.set(this.errorService.extractMessage(err));
      this.isSubmitting.set(false);
    }
  }
}
