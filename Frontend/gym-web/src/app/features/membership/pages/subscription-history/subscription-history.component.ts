import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MembershipService } from '../../services/membership.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Subscription } from '../../models/subscription.model';
import { SubscriptionStatus } from '../../models/subscription-status.enum';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  standalone: true,
  selector: 'app-subscription-history',
  imports: [RouterLink, DashboardMenuComponent, StatusBadgeComponent],
  templateUrl: './subscription-history.component.html',
  styleUrl: './subscription-history.component.css'
})
export class SubscriptionHistoryComponent implements OnInit {

  subscriptions = signal<Subscription[]>([]);
  isLoading     = signal(true);
  errorMessage  = signal<string | null>(null);

  private readonly membershipService = inject(MembershipService);
  private readonly errorService      = inject(ErrorService);
  private readonly destroyRef        = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.membershipService.getMySubscriptions().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (subs) => {
        this.subscriptions.set(subs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(this.errorService.extractMessage(err));
        this.isLoading.set(false);
      }
    });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
  }

  priceLabel(price: number | null): string {
    if (price === null || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  }

  isTerminal(status: SubscriptionStatus): boolean {
    return ['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'UPGRADED', 'DOWNGRADED'].includes(status);
  }
}
