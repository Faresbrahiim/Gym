import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../services/auth.service';
import { emailValidators } from '../../../../shared/validators/email.validator';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule, AuthCardComponent, LoadingButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  isSubmitting = signal(false);
  isSuccess    = signal(false);
  errorMessage = signal<string | null>(null);

  forgotPasswordForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', emailValidators]
    });
  }

  onSubmit(): void {
    if (this.isSubmitting() || this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.requestPasswordReset(this.forgotPasswordForm.value.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Something went wrong. Please try again.');
      }
    });
  }
}
