import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { PasswordRulesComponent } from '../../../../shared/components/password-rules/password-rules.component';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';
import { strongPasswordValidators, passwordMatchValidator } from '../../../../shared/validators/password.validator';
import { emailValidators } from '../../../../shared/validators/email.validator';

@Component({
  standalone: true,
  selector: 'app-setup-password',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AuthCardComponent,
    AuthBannerComponent,
    LoadingButtonComponent,
    PasswordRulesComponent
  ],
  templateUrl: './setup-password.component.html'
})
export class SetupPasswordComponent implements OnInit {

  isSubmitting  = signal(false);
  isSuccess     = signal(false);
  invalidLink   = signal(false);
  errorMessage  = signal<string | null>(null);
  showPassword  = signal(false);
  showConfirm   = signal(false);

  isResending   = signal(false);
  resendSuccess = signal(false);
  resendError   = signal<string | null>(null);

  form!: FormGroup;
  resendForm!: FormGroup;
  private token = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] ?? '';

    this.resendForm = this.fb.group({ email: ['', emailValidators] });

    if (!this.token) {
      this.invalidLink.set(true);
      return;
    }

    this.form = this.fb.group({
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
  toggleConfirm():  void { this.showConfirm.update(v => !v);  }

  onSubmit(): void {
    if (this.isSubmitting() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.acceptInvitation(this.token, this.form.value.password).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.status === 400 || err?.status === 403 || err?.status === 404) {
          this.errorMessage.set('This invitation link is invalid or has already been used. Please contact your administrator.');
        } else {
          this.errorMessage.set(this.errorService.extractMessage(err));
        }
      }
    });
  }

  onResend(): void {
    if (this.isResending() || this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    this.isResending.set(true);
    this.resendError.set(null);

    this.authService.resendInvitation(this.resendForm.value.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
      },
      error: (err) => {
        this.isResending.set(false);
        this.resendError.set(this.errorService.extractMessage(err));
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
