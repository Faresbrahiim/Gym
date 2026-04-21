import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PaymentService } from '../../services/payment.service';
import { PlanService } from '../../../membership/services/plan.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { PaymentResponse } from '../../models/payment.model';
import { PaymentStatus } from '../../models/payment-status.enum';
import { Plan } from '../../../membership/models/plan.model';
import { UserMe } from '../../../profile/models/user-me.model';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentStatusBadgeComponent, DashboardMenuComponent],
  templateUrl: './payment-detail.component.html'
})
export class PaymentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly planService = inject(PlanService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly destroyRef = inject(DestroyRef);

  payment = signal<PaymentResponse | null>(null);
  plan = signal<Plan | null>(null);
  user = signal<UserMe | null>(null);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('paymentId');
    if (!paymentId) {
      this.router.navigate(['/payments']);
      return;
    }
    this.loadData(paymentId);
  }

  loadData(paymentId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.paymentService.getPaymentById(paymentId).pipe(
      switchMap(payment => {
        if (!payment) {
          throw new Error('Payment not found');
        }
        return forkJoin({
          payment: of(payment),
          plan: this.planService.getPlan(payment.planId),
          user: this.currentUserService.getMe()
        });
      }),
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        if (err.message === 'Payment not found') {
          this.router.navigate(['/payments']);
        } else {
          this.errorMessage.set('Failed to load payment details. Please try again later.');
          this.isLoading.set(false);
        }
        return of(null);
      })
    ).subscribe(data => {
      if (!data) return;

      this.payment.set(data.payment);
      this.plan.set(data.plan);
      this.user.set(data.user);
      this.isLoading.set(false);
    });
  }

  printReceipt(): void {
    window.print();
  }
}

