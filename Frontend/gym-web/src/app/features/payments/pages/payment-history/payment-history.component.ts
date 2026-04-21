import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PaymentService } from '../../services/payment.service';
import { MembershipService } from '../../../membership/services/membership.service';
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
  templateUrl: './payment-history.component.html'
})
export class PaymentHistoryComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly membershipService = inject(MembershipService);
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
      payments: this.paymentService.getMyPayments(),
      subscriptions: this.membershipService.getMySubscriptions()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        this.errorMessage.set('Failed to load payments. Please try again later.');
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      if (!data) return;

      const planMap = new Map<string, string>();
      data.subscriptions.forEach(sub => planMap.set(sub.subscriptionId, sub.planName));

      const enriched = data.payments.map(p => ({
        ...p,
        planName: planMap.get(p.subscriptionId) || '—'
      }));

      this.payments.set(enriched);
      this.isLoading.set(false);
    });
  }

  setFilter(status: string): void {
    this.filterStatus.set(status as PaymentStatus | 'ALL');
  }
}

