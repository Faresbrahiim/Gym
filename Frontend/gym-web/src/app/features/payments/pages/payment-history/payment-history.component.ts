import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { PaymentService } from '../../services/payment.service';
import { PlanService } from '../../../membership/services/plan.service';
import { PaymentResponse } from '../../models/payment.model';
import { PaymentStatus } from '../../models/payment-status.enum';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';

interface EnrichedPayment extends PaymentResponse {
  planName: string;
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentStatusBadgeComponent, DashboardMenuComponent],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.css'
})
export class PaymentHistoryComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly planService = inject(PlanService);
  private readonly destroyRef = inject(DestroyRef);

  payments = signal<EnrichedPayment[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  filterStatus = signal<PaymentStatus | 'ALL'>('ALL');

  filteredPayments = computed(() => {
    const status = this.filterStatus();
    const all = this.payments();
    if (status === 'ALL') return all;
    return all.filter(p => p.status === status);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      payments: this.paymentService.getMyPayments().pipe(take(1)),
      plans: this.planService.getAllPlans().pipe(take(1))
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.errorMessage.set('Failed to load payments. Please try again later.');
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      if (!data) return;

      const planMap = new Map<string, string>();
      data.plans.forEach(plan => planMap.set(plan.id, plan.name));

      const enriched = data.payments.map(payment => ({
        ...payment,
        planName: planMap.get(payment.planId) || 'Unknown plan'
      }));

      this.payments.set(enriched);
      this.isLoading.set(false);
    });
  }

  setFilter(status: string): void {
    this.filterStatus.set(status as PaymentStatus | 'ALL');
  }
}
