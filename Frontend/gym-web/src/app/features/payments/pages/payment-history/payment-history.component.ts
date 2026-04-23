import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
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
import { PaginationBarComponent } from '../../../../shared/components/pagination-bar/pagination-bar.component';

interface EnrichedPayment extends PaymentResponse {
  planName: string;
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentStatusBadgeComponent, DashboardMenuComponent, PaginationBarComponent],
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
  currentPage = signal(1);
  totalItems = signal(0);
  totalPages = signal(0);
  pageSize = 10;

  filterStatus = signal<PaymentStatus | 'ALL'>('ALL');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const status = this.filterStatus();
    const selectedStatus = status === 'ALL' ? undefined : status;

    forkJoin({
      payments: this.paymentService.getMyPayments(
        this.currentPage(),
        this.pageSize,
        selectedStatus
      ).pipe(take(1)),
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

      const enriched = data.payments.items.map(payment => ({
        ...payment,
        planName: planMap.get(payment.planId) || 'Unknown plan'
      }));

      this.payments.set(enriched);
      this.totalItems.set(data.payments.totalItems);
      this.totalPages.set(data.payments.totalPages);
      this.currentPage.set(data.payments.page);
      this.isLoading.set(false);
    });
  }

  setFilter(status: string): void {
    this.filterStatus.set(status as PaymentStatus | 'ALL');
    this.currentPage.set(1);
    this.loadData();
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadData();
  }
}
