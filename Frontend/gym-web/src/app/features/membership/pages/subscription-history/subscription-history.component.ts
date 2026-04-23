import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MembershipService } from '../../services/membership.service';
import { ErrorService } from '../../../../core/services/error.service';
import { SubscriptionHistoryEntry } from '../../models/subscription-history-entry.model';
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

  entries = signal<SubscriptionHistoryEntry[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  private readonly membershipService = inject(MembershipService);
  private readonly errorService = inject(ErrorService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.membershipService.getMySubscriptionHistory().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: entries => {
        this.entries.set(entries);
        this.isLoading.set(false);
      },
      error: err => {
        this.errorMessage.set(this.errorService.extractMessage(err));
        this.isLoading.set(false);
      }
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  }

  formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  titleFor(entry: SubscriptionHistoryEntry): string {
    const note = entry.note?.trim();
    if (note) return note;

    if (entry.previousStatus && entry.previousStatus !== entry.newStatus) {
      return `${this.labelFor(entry.previousStatus)} to ${this.labelFor(entry.newStatus)}`;
    }

    return this.labelFor(entry.newStatus);
  }

  descriptionFor(entry: SubscriptionHistoryEntry): string {
    return `Subscription #${entry.subscriptionId.substring(0, 8).toUpperCase()}`;
  }

  isTerminal(status: SubscriptionStatus): boolean {
    return ['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'UPGRADED', 'DOWNGRADED'].includes(status);
  }

  private labelFor(status: SubscriptionStatus): string {
    switch (status) {
      case 'ACTIVE': return 'Activated';
      case 'CANCELLED': return 'Cancelled';
      case 'PAUSED': return 'Paused';
      case 'EXPIRED': return 'Expired';
      case 'UPGRADED': return 'Upgraded';
      case 'DOWNGRADED': return 'Downgraded';
      case 'PAUSE_REQUESTED': return 'Pause requested';
      case 'FROZEN': return 'Frozen';
      case 'CANCEL_REQUESTED': return 'Cancel requested';
      case 'PENDING_PAYMENT': return 'Pending payment';
      case 'PAYMENT_FAILED': return 'Payment failed';
      default: return status;
    }
  }
}
