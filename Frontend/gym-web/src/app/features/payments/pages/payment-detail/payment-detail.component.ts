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
import { PaymentTargetType } from '../../models/payment-target-type.enum';
import { Plan } from '../../../membership/models/plan.model';
import { UserMe } from '../../../profile/models/user-me.model';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentStatusBadgeComponent, DashboardMenuComponent],
  templateUrl: './payment-detail.component.html',
  styleUrl: './payment-detail.component.css'
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
        if (payment.targetType === PaymentTargetType.ORDER) {
          this.router.navigate(payment.orderId ? ['/orders', payment.orderId] : ['/orders']);
          return of(null);
        }

        if (!payment.planId) {
          throw new Error('Membership payment is missing its plan reference');
        }

        return forkJoin({
          payment: of(payment as PaymentResponse),
          plan: this.planService.getPlan(payment.planId),
          user: this.currentUserService.getMe()
        });
      }),
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        if (err?.status === 404 || err?.message === 'Payment not found') {
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
    const card = document.querySelector('.receipt-card') as HTMLElement;
    if (!card) return;

    // Clone so we don't mutate the live DOM
    const clone = card.cloneNode(true) as HTMLElement;

    // Strip anything that must not appear on paper
    clone.querySelectorAll('.d-print-none, button, [class*="btn"]').forEach(el => el.remove());

    // Make asset paths absolute so images load in the popup
    const origin = window.location.origin;
    const html = clone.outerHTML
      .replace(/src="assets\//g, `src="${origin}/assets/`)
      .replace(/href="assets\//g, `href="${origin}/assets/`);

    // Only carry over external stylesheet links (Bootstrap, fonts, icons)
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(el => el.outerHTML).join('\n');

    const win = window.open('', '_blank', 'width=820,height=900');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
  ${styleLinks}
  <style>
    @page { size: A4; margin: 0; }
    body { background: #fff; margin: 0; padding: 15mm; box-sizing: border-box; }
  </style>
</head>
<body>${html}</body>
</html>`);
    win.document.close();
    win.focus();
    // Wait for stylesheets to load before printing
    setTimeout(() => { win.print(); win.close(); }, 800);
  }
}
