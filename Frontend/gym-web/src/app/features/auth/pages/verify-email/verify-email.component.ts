import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../services/auth.service';
import { emailValidators } from '../../../../shared/validators/email.validator';

@Component({
  standalone: true,
  selector: 'app-verify-email',
  imports: [RouterLink, ReactiveFormsModule, AuthCardComponent, LoadingButtonComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {

  isLoading           = signal(true);
  verificationSuccess = signal(false);
  errorMessage        = signal<string | null>(null);

  isResending   = signal(false);
  resendSuccess = signal(false);
  resendError   = signal<string | null>(null);

  resendForm!: FormGroup;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.resendForm = this.fb.group({ email: ['', emailValidators] });

    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid verification link.');
      return;
    }

    this.authService.verifyEmail(token).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.verificationSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.status === 403
          ? 'This verification link is invalid or has expired.'
          : 'Something went wrong. Please try again later.');
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

    this.authService.resendVerification(this.resendForm.value.email).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
      },
      error: () => {
        this.isResending.set(false);
        this.resendError.set('Something went wrong. Please try again.');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
