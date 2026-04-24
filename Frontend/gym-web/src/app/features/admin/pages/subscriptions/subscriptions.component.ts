import { Component, OnInit, ViewChild, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, forkJoin } from 'rxjs';
import { AdminSubscriptionService } from '../../services/admin-subscription.service';
import { AdminSubscriptionSummary } from '../../models/admin-subscription-summary.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Subscription } from '../../../membership/models/subscription.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationBarComponent } from '../../../../shared/components/pagination-bar/pagination-bar.component';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_FAILED: 'Payment Failed',
  PAUSE_REQUESTED: 'Pause Requested',
  CANCEL_REQUESTED: 'Cancel Requested',
  PAUSED: 'Paused',
  FROZEN: 'Frozen',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  UPGRADED: 'Upgraded',
  DOWNGRADED: 'Downgraded',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge--active',
  PENDING_PAYMENT: 'badge--pending',
  PAYMENT_FAILED: 'badge--failed',
  PAUSE_REQUESTED: 'badge--pause-req',
  CANCEL_REQUESTED: 'badge--cancel-req',
  PAUSED: 'badge--paused',
  FROZEN: 'badge--frozen',
  EXPIRED: 'badge--muted',
  CANCELLED: 'badge--muted',
  UPGRADED: 'badge--muted',
  DOWNGRADED: 'badge--muted',
};

@Component({
  standalone: true,
  selector: 'app-subscriptions',
  imports: [ConfirmModalComponent, PaginationBarComponent],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css'
})
export class SubscriptionsComponent implements OnInit {

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  subscriptions = signal<Subscription[]>([]);
  summary = signal<AdminSubscriptionSummary>({
    totalCount: 0,
    activeCount: 0,
    pendingCount: 0,
    issueCount: 0
  });
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  searchTerm = signal('');
  statusFilter = signal('ALL');

  actionLoading = signal<string | null>(null);

  currentPage = signal(1);
  totalPages = signal(0);
  pageSize = 10;

  freezeModalSub = signal<Subscription | null>(null);
  freezeEnd = signal('');

  extendModalSub = signal<Subscription | null>(null);
  extendDays = signal(30);

  modalTitle = '';
  modalMessage = '';
  modalConfirmLabel = 'Confirm';
  modalConfirmClass = 'btn-danger';
  private pendingAction: (() => void) | null = null;

  totalCount = computed(() => this.summary().totalCount);
  activeCount = computed(() => this.summary().activeCount);
  pendingCount = computed(() => this.summary().pendingCount);
  issueCount = computed(() => this.summary().issueCount);

  private readonly adminSubService = inject(AdminSubscriptionService);
  private readonly toastService = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      page: this.adminSubService.getAll(
        this.currentPage(),
        this.pageSize,
        this.statusFilter(),
        this.searchTerm()
      ),
      summary: this.adminSubService.getSummary()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ page, summary }) => {
        this.subscriptions.set(page.items);
        this.summary.set(summary);
        this.currentPage.set(page.page);
        this.totalPages.set(page.totalPages);
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

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  }

  avatarInitials(sub: Subscription): string {
    if (sub.userEmail) {
      return sub.userEmail.slice(0, 2).toUpperCase();
    }
    return sub.userId.slice(0, 2).toUpperCase();
  }

  isPendingAction(status: string): boolean {
    return status === 'PAUSE_REQUESTED' || status === 'CANCEL_REQUESTED';
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusBadgeClass(status: string): string {
    return STATUS_BADGE[status] ?? 'badge--muted';
  }

  priceLabel(price: number | null): string {
    if (price === null || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
    this.load();
  }

  setStatusFilter(status: string): void {
    if (this.statusFilter() === status) return;
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.load();
  }

  onFreezeEndChange(event: Event): void {
    this.freezeEnd.set((event.target as HTMLInputElement).value);
  }

  onExtendDaysChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.extendDays.set(value > 0 ? value : 1);
  }

  private openConfirm(title: string, message: string, label: string, cls: string, action: () => void): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalConfirmLabel = label;
    this.modalConfirmClass = cls;
    this.pendingAction = action;
    this.confirmModal.open();
  }

  onModalConfirmed(): void {
    this.pendingAction?.();
    this.pendingAction = null;
  }

  private runAction(id: string, action$: Observable<Subscription>, successMsg: string): void {
    this.actionLoading.set(id);
    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastService.success(successMsg);
        this.actionLoading.set(null);
        this.load();
      },
      error: (err) => {
        this.toastService.error(this.errorService.extractMessage(err));
        this.actionLoading.set(null);
      }
    });
  }

  onApprovePause(sub: Subscription): void {
    this.openConfirm(
      'Approve Pause Request',
      `Approve the pause request for "${sub.planName}"? The subscription will be paused.`,
      'Approve',
      'btn-success',
      () => this.runAction(sub.subscriptionId, this.adminSubService.approvePause(sub.subscriptionId), 'Pause approved.')
    );
  }

  onRejectPause(sub: Subscription): void {
    this.openConfirm(
      'Reject Pause Request',
      `Reject the pause request for "${sub.planName}" and keep the subscription active?`,
      'Reject',
      'btn-danger',
      () => this.runAction(sub.subscriptionId, this.adminSubService.rejectPause(sub.subscriptionId), 'Pause request rejected.')
    );
  }

  onConfirmCancelRequest(sub: Subscription): void {
    this.openConfirm(
      'Confirm Cancellation',
      `Confirm the cancellation request for "${sub.planName}"? This will cancel the subscription.`,
      'Confirm Cancel',
      'btn-danger',
      () => this.runAction(sub.subscriptionId, this.adminSubService.cancel(sub.subscriptionId), 'Subscription cancelled.')
    );
  }

  onRejectCancelRequest(sub: Subscription): void {
    this.openConfirm(
      'Reject Cancellation',
      `Reject the cancellation request and restore "${sub.planName}" to Active?`,
      'Reject & Restore',
      'btn-primary',
      () => this.runAction(sub.subscriptionId, this.adminSubService.activate(sub.subscriptionId), 'Cancellation rejected. Subscription restored.')
    );
  }

  onActivate(sub: Subscription): void {
    this.openConfirm(
      'Activate Subscription',
      `Force-activate the "${sub.planName}" subscription?`,
      'Activate',
      'btn-primary',
      () => this.runAction(sub.subscriptionId, this.adminSubService.activate(sub.subscriptionId), 'Subscription activated.')
    );
  }

  onCancel(sub: Subscription): void {
    this.openConfirm(
      'Cancel Subscription',
      `Cancel the "${sub.planName}" subscription? This cannot be undone.`,
      'Cancel Subscription',
      'btn-danger',
      () => this.runAction(sub.subscriptionId, this.adminSubService.cancel(sub.subscriptionId), 'Subscription cancelled.')
    );
  }

  openFreezeModal(sub: Subscription): void {
    this.freezeEnd.set('');
    this.freezeModalSub.set(sub);
  }

  closeFreezeModal(): void {
    this.freezeModalSub.set(null);
  }

  confirmFreeze(): void {
    const sub = this.freezeModalSub();
    const end = this.freezeEnd();
    if (!sub || !end) return;
    const formatted = end.length === 16 ? end + ':00' : end;
    this.freezeModalSub.set(null);
    this.runAction(sub.subscriptionId, this.adminSubService.freeze(sub.subscriptionId, formatted), 'Membership frozen.');
  }

  openExtendModal(sub: Subscription): void {
    this.extendDays.set(30);
    this.extendModalSub.set(sub);
  }

  closeExtendModal(): void {
    this.extendModalSub.set(null);
  }

  confirmExtend(): void {
    const sub = this.extendModalSub();
    const days = this.extendDays();
    if (!sub || days <= 0) return;
    this.extendModalSub.set(null);
    this.runAction(sub.subscriptionId, this.adminSubService.extend(sub.subscriptionId, days), `Membership extended by ${days} day${days === 1 ? '' : 's'}.`);
  }
}
