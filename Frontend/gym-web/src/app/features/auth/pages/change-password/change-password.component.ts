import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { PasswordRulesComponent } from '../../../../shared/components/password-rules/password-rules.component';
import { AuthService } from '../../services/auth.service';
import { strongPasswordValidators, passwordMatchValidator } from '../../../../shared/validators/password.validator';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [RouterLink, ReactiveFormsModule, AuthCardComponent, LoadingButtonComponent, PasswordRulesComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {

  isSubmitting = signal(false);
  isSuccess    = signal(false);
  invalidLink  = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirm  = signal(false);

  changePasswordForm!: FormGroup;
  private token = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] ?? '';

    if (!this.token) {
      this.invalidLink.set(true);
      return;
    }

    this.changePasswordForm = this.fb.group({
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
  toggleConfirm():  void { this.showConfirm.update(v => !v);  }

  onSubmit(): void {
    if (this.isSubmitting() || this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword(this.token, this.changePasswordForm.value.password).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.status === 400 || err?.status === 403 || err?.status === 404) {
          this.errorMessage.set('This reset link is invalid or has expired. Please request a new one.');
        } else {
          this.errorMessage.set('Something went wrong. Please try again.');
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
