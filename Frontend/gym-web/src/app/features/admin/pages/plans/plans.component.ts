import { Component, OnInit, ViewChild, signal, computed, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlanService } from '../../../membership/services/plan.service';
import { AdminPlanService, PlanCreateDTO, PlanUpdateDTO } from '../../services/admin-plan.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Plan } from '../../../membership/models/plan.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

interface PlanForm {
  name: string;
  description: string;
  price: number;
  durationInDays: number | null;
  features: string[];
}

@Component({
  standalone: true,
  selector: 'app-plans',
  imports: [FormsModule, ConfirmModalComponent],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.css'
})
export class PlansComponent implements OnInit {
  private static readonly MAX_ACTIVE_PAID_PLANS = 3;

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  // ── Data ────────────────────────────────────────────────────────────
  plans       = signal<Plan[]>([]);
  isLoading   = signal(true);
  errorMessage = signal<string | null>(null);
  actionLoading = signal<string | null>(null);

  // ── Search ───────────────────────────────────────────────────────────
  searchTerm = signal('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.plans();
    return this.plans().filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description?.toLowerCase().includes(term) ?? false)
    );
  });

  // ── Stats ────────────────────────────────────────────────────────────
  totalCount    = computed(() => this.plans().length);
  activeCount   = computed(() => this.plans().filter(p => p.status === 'ACTIVE').length);
  inactiveCount = computed(() => this.plans().filter(p => p.status === 'INACTIVE').length);
  freeCount     = computed(() => this.plans().filter(p => p.price === 0).length);
  activePaidCount = computed(() => this.plans().filter(p => p.status === 'ACTIVE' && this.isPaid(p.price)).length);
  paidPlanLimitReached = computed(() => this.activePaidCount() >= PlansComponent.MAX_ACTIVE_PAID_PLANS);

  // ── Create / Edit modal ──────────────────────────────────────────────
  showFormModal = signal(false);
  editingPlan   = signal<Plan | null>(null);
  formSaving    = signal(false);
  form: PlanForm = { name: '', description: '', price: 0, durationInDays: null, features: [] };

  // ── Confirm modal ─────────────────────────────────────────────────────
  modalTitle        = '';
  modalMessage      = '';
  modalConfirmLabel = 'Confirm';
  modalConfirmClass = 'btn-danger';
  private pendingAction: (() => void) | null = null;

  private readonly planService      = inject(PlanService);
  private readonly adminPlanService = inject(AdminPlanService);
  private readonly toastService     = inject(ToastService);
  private readonly errorService     = inject(ErrorService);
  private readonly destroyRef       = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.planService.getAllPlans().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(this.errorService.extractMessage(err));
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  // ── Form modal ───────────────────────────────────────────────────────
  openCreate(): void {
    this.editingPlan.set(null);
    this.form = { name: '', description: '', price: 0, durationInDays: null, features: [] };
    this.showFormModal.set(true);
  }

  openEdit(plan: Plan): void {
    this.editingPlan.set(plan);
    this.form = {
      name: plan.name,
      description: plan.description ?? '',
      price: plan.price,
      durationInDays: plan.durationInDays,
      features: plan.features ? [...plan.features] : []
    };
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  saveForm(): void {
    if (!this.form.name.trim()) return;
    const editing = this.editingPlan();

    if (this.wouldExceedPaidPlanLimit(editing)) {
      this.toastService.info(this.paidPlanLimitMessage());
      return;
    }

    this.formSaving.set(true);

    if (editing) {
      const dto: PlanUpdateDTO = {
        name: this.form.name.trim(),
        description: this.form.description.trim() || null,
        price: this.form.price,
        durationInDays: this.form.durationInDays,
        status: null,
        features: this.form.features.filter(f => f.trim().length > 0)
      };
      this.adminPlanService.update(editing.id, dto).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (updated) => {
          this.plans.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.toastService.success('Plan updated.');
          this.formSaving.set(false);
          this.showFormModal.set(false);
        },
        error: (err) => {
          this.toastService.error(this.errorService.extractMessage(err));
          this.formSaving.set(false);
        }
      });
    } else {
      const dto: PlanCreateDTO = {
        name: this.form.name.trim(),
        description: this.form.description.trim() || null,
        price: this.form.price,
        durationInDays: this.form.durationInDays,
        features: this.form.features.filter(f => f.trim().length > 0)
      };
      this.adminPlanService.create(dto).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (created) => {
          this.plans.update(list => [created, ...list]);
          this.toastService.success('Plan created.');
          this.formSaving.set(false);
          this.showFormModal.set(false);
        },
        error: (err) => {
          this.toastService.error(this.errorService.extractMessage(err));
          this.formSaving.set(false);
        }
      });
    }
  }

  addFeature(): void {
    this.form.features.push('');
  }

  removeFeature(index: number): void {
    this.form.features.splice(index, 1);
  }

  trackByIndex(index: number, obj: any): any {
    return index;
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

  // ── Actions ──────────────────────────────────────────────────────────
  onToggleEnable(plan: Plan): void {
    if (plan.status === 'INACTIVE' && this.isPaid(plan.price) && this.paidPlanLimitReached()) {
      this.toastService.info(this.paidPlanLimitMessage());
      return;
    }

    const label   = plan.status === 'ACTIVE' ? 'Disable' : 'Enable';
    const message = plan.status === 'ACTIVE'
      ? `Disable the "${plan.name}" plan? Members won't be able to subscribe to it.`
      : `Enable the "${plan.name}" plan? It will be visible to members.`;
    this.openConfirm(`${label} Plan`, message, label,
      plan.status === 'ACTIVE' ? 'btn-danger' : 'btn-success',
      () => {
        const id = plan.id;
        this.actionLoading.set(id);
        const request = plan.status === 'ACTIVE'
          ? this.adminPlanService.disable(id)
          : this.adminPlanService.enable(id);
          
        request.pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: (updated) => {
            this.plans.update(list => list.map(p => p.id === updated.id ? updated : p));
            this.toastService.success(`Plan ${updated.status === 'ACTIVE' ? 'enabled' : 'disabled'}.`);
            this.actionLoading.set(null);
          },
          error: (err) => {
            this.toastService.error(this.errorService.extractMessage(err));
            this.actionLoading.set(null);
          }
        });
      }
    );
  }

  onDelete(plan: Plan): void {
    this.openConfirm(
      'Delete Plan',
      `Permanently delete "${plan.name}"? This cannot be undone.`,
      'Delete', 'btn-danger',
      () => {
        const id = plan.id;
        this.actionLoading.set(id + '-del');
        this.adminPlanService.delete(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.plans.update(list => list.filter(p => p.id !== id));
            this.toastService.success('Plan deleted.');
            this.actionLoading.set(null);
          },
          error: (err) => {
            const msg = this.errorService.extractMessage(err);
            this.openConfirm('Error Deleting Plan', msg, 'Close', 'btn-secondary', () => {});
            this.actionLoading.set(null);
          }
        });
      }
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  priceLabel(price: number): string {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  }

  durationLabel(days: number | null): string {
    if (!days || days === 2147483647) return 'Unlimited';
    if (days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? 's' : ''}`;
    if (days % 30 === 0)  return `${days / 30} month${days / 30 > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  paidPlanLimitMessage(): string {
    return 'You already have 3 active paid plans. Disable or delete one before adding or reactivating another.';
  }

  shouldShowPaidPlanLimitInForm(): boolean {
    return this.paidPlanLimitReached() && this.isPaid(this.form.price) && this.wouldExceedPaidPlanLimit(this.editingPlan());
  }

  private wouldExceedPaidPlanLimit(editing: Plan | null): boolean {
    const targetStatus = editing?.status ?? 'ACTIVE';
    const targetIsActivePaid = targetStatus === 'ACTIVE' && this.isPaid(this.form.price);
    if (!targetIsActivePaid) {
      return false;
    }

    const currentIsActivePaid = !!editing && editing.status === 'ACTIVE' && this.isPaid(editing.price);
    if (currentIsActivePaid) {
      return false;
    }

    return this.activePaidCount() >= PlansComponent.MAX_ACTIVE_PAID_PLANS;
  }

  private isPaid(price: number | null | undefined): boolean {
    return (price ?? 0) > 0;
  }
}
