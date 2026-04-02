import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../../../core/auth/token.service';
import { TwoFactorStateService } from '../../services/two-factor-state.service';

@Component({
  standalone: true,
  selector: 'app-verify-two-factor',
  imports: [ReactiveFormsModule, AuthCardComponent, LoadingButtonComponent],
  templateUrl: './verify-two-factor.component.html',
  styleUrl: './verify-two-factor.component.css'
})
export class VerifyTwoFactorComponent implements OnInit {

  isLoading    = signal(false);
  errorMessage = signal<string | null>(null);

  codeForm: FormGroup;

  private userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private twoFactorStateService: TwoFactorStateService,
    private router: Router
  ) {
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6,8}$/)]]
    });
  }

  ngOnInit(): void {
    this.userId = this.twoFactorStateService.getPendingUserId();

    if (!this.userId) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.isLoading()) return;

    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyTwoFactor({
      userId: this.userId!,
      code: this.codeForm.value.code
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const returnUrl = this.twoFactorStateService.getReturnUrl() || '/home';
        this.tokenService.setTokens(response.accessToken!, response.refreshToken!);
        this.twoFactorStateService.clear();
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.status === 401
          ? 'Invalid or expired code. Please try again.'
          : 'Something went wrong. Please try again.');
      }
    });
  }

  goBack(): void {
    this.twoFactorStateService.clear();
    this.router.navigate(['/login']);
  }
}
