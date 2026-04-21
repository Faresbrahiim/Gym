import { Component, OnInit, ViewChild, signal, inject, DestroyRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { MembershipService } from '../../services/membership.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Subscription } from '../../models/subscription.model';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  standalone: true,
  selector: 'app-my-membership',
  imports: [RouterLink, DashboardMenuComponent, StatusBadgeComponent, LoadingButtonComponent, ConfirmModalComponent],
  templateUrl: './my-membership.component.html',
  styleUrl: './my-membership.component.css'
})
export class MyMembershipComponent implements OnInit {

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  isLoading    = signal(true);
  subscription = signal<Subscription | null>(null);
  errorMessage = signal<string | null>(null);

  isCancelling = signal(false);
  isPausing    = signal(false);
  isResuming   = signal(false);
  isRenewing   = signal(false);

  modalTitle        = '';
  modalMessage      = '';
  modalConfirmLabel = 'Confirm';
  modalConfirmClass = 'btn-danger';
  private pendingAction: (() => void) | null = null;

  private readonly membershipService = inject(MembershipService);
  private readonly tokenService      = inject(TokenService);
  private readonly toastService      = inject(ToastService);
  private readonly errorService      = inject(ErrorService);
  private readonly router            = inject(Router);
  private readonly destroyRef        = inject(DestroyRef);

  ngOnInit(): void {
    const role = this.tokenService.getRole();
    if (role === 'ADMIN') { this.router.navigate(['/admin/dashboard']); return; }
    if (role === 'COACH')  { this.router.navigate(['/home']); return; }
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.membershipService.getCurrentSubscription().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.isLoading.set(false);
      },
      error: (err) => {
        const isServerError = err instanceof HttpErrorResponse && err.status >= 500;
        const msg = isServerError
          ? 'Unable to load your membership. Please try again.'
          : this.errorService.extractMessage(err);
        this.errorMessage.set(msg);
        this.toastService.error(msg);
        this.isLoading.set(false);
      }
    });
  }

  isFree(): boolean {
    const price = this.subscription()?.planPrice;
    return price === null || price === 0;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return iso; }
  }

  private openModal(title: string, message: string, confirmLabel: string, confirmClass: string, action: () => void): void {
    this.modalTitle        = title;
    this.modalMessage      = message;
    this.modalConfirmLabel = confirmLabel;
    this.modalConfirmClass = confirmClass;
    this.pendingAction     = action;
    this.confirmModal.open();
  }

  onModalConfirmed(): void {
    this.pendingAction?.();
    this.pendingAction = null;
  }

  onCancel(): void {
    this.openModal(
      'Cancel Membership',
      'Are you sure you want to cancel your membership? You will be moved to the free plan.',
      'Yes, Cancel',
      'btn-danger',
      () => {
        const id = this.subscription()!.subscriptionId;
        this.isCancelling.set(true);
        this.membershipService.cancel(id).pipe(
          switchMap(() => this.membershipService.activateFree()),
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.toastService.success('Membership cancelled. You have been moved to the free plan.');
            this.isCancelling.set(false);
            this.loadSubscription();
          },
          error: (err) => {
            this.toastService.error(this.errorService.extractMessage(err));
            this.isCancelling.set(false);
            this.loadSubscription();
          }
        });
      }
    );
  }

  onPause(): void {
    this.openModal(
      'Request Pause',
      'Your pause request will be sent to an admin for approval. Your membership remains active until approved.',
      'Request Pause',
      'btn-primary',
      () => {
        const id = this.subscription()!.subscriptionId;
        this.isPausing.set(true);
        this.membershipService.pause(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.toastService.success('Pause request submitted. Awaiting admin approval.');
            this.isPausing.set(false);
            this.loadSubscription();
          },
          error: (err) => {
            this.toastService.error(this.errorService.extractMessage(err));
            this.isPausing.set(false);
          }
        });
      }
    );
  }

  onResume(): void {
    this.openModal(
      'Resume Membership',
      'Your membership will become active again immediately.',
      'Resume',
      'btn-primary',
      () => {
        const id = this.subscription()!.subscriptionId;
        this.isResuming.set(true);
        this.membershipService.resume(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.toastService.success('Membership resumed!');
            this.isResuming.set(false);
            this.loadSubscription();
          },
          error: (err) => {
            this.toastService.error(this.errorService.extractMessage(err));
            this.isResuming.set(false);
          }
        });
      }
    );
  }

  onRenew(): void {
    this.openModal(
      'Renew Membership',
      'This will extend your membership by the plan duration.',
      'Renew',
      'btn-primary',
      () => {
        const id = this.subscription()!.subscriptionId;
        this.isRenewing.set(true);
        this.membershipService.renew(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.toastService.success('Membership renewed!');
            this.isRenewing.set(false);
            this.loadSubscription();
          },
          error: (err) => {
            this.toastService.error(this.errorService.extractMessage(err));
            this.isRenewing.set(false);
          }
        });
      }
    );
  }

  onChangePlan(): void {
    this.router.navigate(['/membership/plans']);
  }
}
