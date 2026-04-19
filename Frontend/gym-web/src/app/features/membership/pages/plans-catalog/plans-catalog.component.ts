import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlanService } from '../../services/plan.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Plan } from '../../models/plan.model';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';

@Component({
  standalone: true,
  selector: 'app-plans-catalog',
  imports: [RouterLink, PlanCardComponent],
  templateUrl: './plans-catalog.component.html',
  styleUrl: './plans-catalog.component.css'
})
export class PlansCatalogComponent implements OnInit {

  isLoading = signal(true);
  plans     = signal<Plan[]>([]);
  errorMessage = signal<string | null>(null);

  private readonly planService  = inject(PlanService);
  private readonly tokenService = inject(TokenService);
  private readonly toastService = inject(ToastService);
  private readonly errorService = inject(ErrorService);
  private readonly router       = inject(Router);
  private readonly destroyRef   = inject(DestroyRef);

  ngOnInit(): void {
    const role = this.tokenService.getRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    if (role === 'COACH') {
      this.router.navigate(['/home']);
      return;
    }
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.planService.getActivePlans().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.plans.set(data);
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

  onSelectPlan(planId: string): void {
    if (this.tokenService.isAuthenticated()) {
      this.router.navigate(['/membership/checkout', planId]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/membership/checkout/${planId}` }
      });
    }
  }
}
