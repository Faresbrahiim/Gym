import { Component, OnInit, ViewChild, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AdminSubscriptionService } from '../../services/admin-subscription.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Subscription } from '../../../membership/models/subscription.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:           'Active',
  PENDING_PAYMENT:  'Pending Payment',
  PAYMENT_FAILED:   'Payment Failed',
  PAUSE_REQUESTED:  'Pause Requested',
  CANCEL_REQUESTED: 'Cancel Requested',
  PAUSED:           'Paused',
  FROZEN:           'Frozen',
  EXPIRED:          'Expired',
  CANCELLED:        'Cancelled',
  UPGRADED:         'Upgraded',
  DOWNGRADED:       'Downgraded',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:           'badge--active',
  PENDING_PAYMENT:  'badge--pending',
  PAYMENT_FAILED:   'badge--failed',
  PAUSE_REQUESTED:  'badge--pause-req',
  CANCEL_REQUESTED: 'badge--cancel-req',
  PAUSED:           'badge--paused',
  FROZEN:           'badge--frozen',
  EXPIRED:          'badge--muted',
  CANCELLED:        'badge--muted',
  UPGRADED:         'badge--muted',
  DOWNGRADED:       'badge--muted',
};

@Component({
  standalone: true,
  selector: 'app-subscriptions',
  imports: [ConfirmModalComponent],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css'
})
export class SubscriptionsComponent implements OnInit {

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  // ── Data ────────────────────────────────────────────────────────────
  subscriptions = signal<Subscription[]>([]);
  isLoading     = signal(true);
  errorMessage  = signal<string | null>(null);

  // ── Filters ─────────────────────────────────────────────────────────
  searchTerm   = signal('');
  statusFilter = signal('ALL');

  // ── Action state ─────────────────────────────────────────────────────
  actionLoading = signal<string | null>(null);

  // ── Freeze modal ─────────────────────────────────────────────────────
  freezeModalSub = signal<Subscription | null>(null);
  freezeEnd      = signal('');

  // ── Extend modal ─────────────────────────────────────────────────────
  extendModalSub = signal<Subscription | null>(null);
  extendDays     = signal(30);

  // ── Confirm modal ─────────────────────────────────────────────────────
  modalTitle        = '';
  modalMessage      = '';
  modalConfirmLabel = 'Confirm';
  modalConfirmClass = 'btn-danger';
  private pendingAction: (() => void) | null = null;

  // ── Computed stats ───────────────────────────────────────────────────
  totalCount   = computed(() => this.subscriptions().length);
  activeCount  = computed(() => this.subscriptions().filter(s => s.status === 'ACTIVE').length);
  pendingCount = computed(() => this.subscriptions().filter(s => s.status === 'PAUSE_REQUESTED' || s.status === 'CANCEL_REQUESTED').length);
  issueCount   = computed(() => this.subscriptions().filter(s => s.status === 'PAYMENT_FAILED' || s.status === 'EXPIRED').length);

  // ── Filtered list ────────────────────────────────────────────────────
  filtered = computed(() => {
    let list = this.subscriptions();

    const filter = this.statusFilter();
    if (filter === 'PENDING') {
      list = list.filter(s => s.status === 'PAUSE_REQUESTED' || s.status === 'CANCEL_REQUESTED');
    } else if (filter === 'ISSUES') {
      list = list.filter(s => s.status === 'PAYMENT_FAILED' || s.status === 'EXPIRED');
    } else if (filter !== 'ALL') {
      list = list.filter(s => s.status === filter);
    }

    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      list = list.filter(s =>
        s.planName.toLowerCase().includes(term) ||
        (s.userEmail?.toLowerCase().includes(term) ?? false)
      );
    }

    return list;
  });

  private readonly adminSubService = inject(AdminSubscriptionService);
  private readonly toastService    = inject(ToastService);
  private readonly errorService    = inject(ErrorService);
  private readonly destroyRef      = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminSubService.getAll().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (subs) => {
        this.subscriptions.set(subs);
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

  // ── Utilities ────────────────────────────────────────────────────────
  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
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
  }

  onFreezeEndChange(event: Event): void {
    this.freezeEnd.set((event.target as HTMLInputElement).value);
  }

  onExtendDaysChange(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    this.extendDays.set(v > 0 ? v : 1);
  }

  // ── Confirm modal ────────────────────────────────────────────────────
  private openConfirm(title: string, message: string, label: string, cls: string, action: () => void): void {
    this.modalTitle        = title;
    this.modalMessage      = message;
    this.modalConfirmLabel = label;
    this.modalConfirmClass = cls;
    this.pendingAction     = action;
    this.confirmModal.open();
  }

  onModalConfirmed(): void {
    this.pendingAction?.();
    this.pendingAction = null;
  }

  // ── Generic action runner ────────────────────────────────────────────
  private runAction(id: string, action$: Observable<Subscription>, successMsg: string): void {
    this.actionLoading.set(id);
    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.subscriptions.update(list => list.map(s => s.subscriptionId === id ? updated : s));
        this.toastService.success(successMsg);
        this.actionLoading.set(null);
      },
      error: (err) => {
        this.toastService.error(this.errorService.extractMessage(err));
        this.actionLoading.set(null);
      }
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────
  onApprovePause(sub: Subscription): void {
    this.openConfirm(
      'Approve Pause Request',
      `Approve the pause request for "${sub.planName}"? The subscription will be paused.`,
      'Approve', 'btn-success',
      () => this.runAction(sub.subscriptionId, this.adminSubService.approvePause(sub.subscriptionId), 'Pause approved.')
    );
  }

  onRejectPause(sub: Subscription): void {
    this.openConfirm(
      'Reject Pause Request',
      `Reject the pause request for "${sub.planName}" and keep the subscription active?`,
      'Reject', 'btn-danger',
      () => this.runAction(sub.subscriptionId, this.adminSubService.rejectPause(sub.subscriptionId), 'Pause request rejected.')
    );
  }

  onConfirmCancelRequest(sub: Subscription): void {
    this.openConfirm(
      'Confirm Cancellation',
      `Confirm the cancellation request for "${sub.planName}"? This will cancel the subscription.`,
      'Confirm Cancel', 'btn-danger',
      () => this.runAction(sub.subscriptionId, this.adminSubService.cancel(sub.subscriptionId), 'Subscription cancelled.')
    );
  }

  onRejectCancelRequest(sub: Subscription): void {
    this.openConfirm(
      'Reject Cancellation',
      `Reject the cancellation request and restore "${sub.planName}" to Active?`,
      'Reject & Restore', 'btn-primary',
      () => this.runAction(sub.subscriptionId, this.adminSubService.activate(sub.subscriptionId), 'Cancellation rejected. Subscription restored.')
    );
  }

  onActivate(sub: Subscription): void {
    this.openConfirm(
      'Activate Subscription',
      `Force-activate the "${sub.planName}" subscription?`,
      'Activate', 'btn-primary',
      () => this.runAction(sub.subscriptionId, this.adminSubService.activate(sub.subscriptionId), 'Subscription activated.')
    );
  }

  onCancel(sub: Subscription): void {
    this.openConfirm(
      'Cancel Subscription',
      `Cancel the "${sub.planName}" subscription? This cannot be undone.`,
      'Cancel Subscription', 'btn-danger',
      () => this.runAction(sub.subscriptionId, this.adminSubService.cancel(sub.subscriptionId), 'Subscription cancelled.')
    );
  }

  // ── Freeze modal ─────────────────────────────────────────────────────
  openFreezeModal(sub: Subscription): void {
    this.freezeEnd.set('');
    this.freezeModalSub.set(sub);
  }

  closeFreezeModal(): void { this.freezeModalSub.set(null); }

  confirmFreeze(): void {
    const sub = this.freezeModalSub();
    const end = this.freezeEnd();
    if (!sub || !end) return;
    const formatted = end.length === 16 ? end + ':00' : end;
    this.freezeModalSub.set(null);
    this.runAction(sub.subscriptionId, this.adminSubService.freeze(sub.subscriptionId, formatted), 'Membership frozen.');
  }

  // ── Extend modal ──────────────────────────────────────────────────────
  openExtendModal(sub: Subscription): void {
    this.extendDays.set(30);
    this.extendModalSub.set(sub);
  }

  closeExtendModal(): void { this.extendModalSub.set(null); }

  confirmExtend(): void {
    const sub  = this.extendModalSub();
    const days = this.extendDays();
    if (!sub || days <= 0) return;
    this.extendModalSub.set(null);
    this.runAction(sub.subscriptionId, this.adminSubService.extend(sub.subscriptionId, days), `Membership extended by ${days} day${days === 1 ? '' : 's'}.`);
  }
}
