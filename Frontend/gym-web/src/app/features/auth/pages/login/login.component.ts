import { Component, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { emailValidators } from '../../../../shared/validators/email.validator';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../../../core/auth/token.service';
import { TwoFactorStateService } from '../../services/two-factor-state.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { LoginRequest } from '../../../../shared/models/auth/login-request.model';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, AuthBannerComponent, AuthCardComponent, LoadingButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  showUserPassword = false;
  showCoachPassword = false;

  isLoading    = signal(false);
  errorMessage = signal<string | null>(null);

  userLoginForm: FormGroup;
  coachLoginForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private twoFactorStateService: TwoFactorStateService,
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userLoginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', Validators.required]
    });

    this.coachLoginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', Validators.required]
    });
  }

  toggleUserPassword(): void  { this.showUserPassword  = !this.showUserPassword;  }
  toggleCoachPassword(): void { this.showCoachPassword = !this.showCoachPassword; }

  private handleLoginResponse(response: any, returnUrl: string): void {
    if (response.requiresTwoFactor && response.userId) {
      this.isLoading.set(false);
      this.twoFactorStateService.setPending(response.userId, returnUrl);
      this.router.navigate(['/verify-2fa']);
    } else if (response.accessToken && response.refreshToken) {
      this.tokenService.setTokens(response.accessToken, response.refreshToken);
      this.redirectAfterLogin(returnUrl);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Something went wrong. Please try again.');
    }
  }

  private redirectAfterLogin(returnUrl: string): void {
    const role = this.tokenService.getRole();

    // Admins skip onboarding check
    if (role === 'ADMIN') {
      this.isLoading.set(false);
      this.router.navigateByUrl(returnUrl);
      return;
    }

    // Check if role-specific profile exists to decide onboarding
    this.profileService.getMe().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (userMe) => {
        this.isLoading.set(false);
        const needsOnboarding = role === 'MEMBER'
          ? userMe.memberProfile === null
          : userMe.coachProfile === null;

        this.router.navigate(needsOnboarding ? ['/profile/onboarding'] : [returnUrl]);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  onUserLoginSubmit(): void {
    if (this.isLoading()) return;
    if (this.userLoginForm.invalid) {
      this.userLoginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.userLoginForm.value;
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.handleLoginResponse(response, returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.status === 401
          ? 'Invalid email or password.'
          : 'Something went wrong. Please try again.');
      }
    });
  }

  onCoachLoginSubmit(): void {
    if (this.isLoading()) return;
    if (this.coachLoginForm.invalid) {
      this.coachLoginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.coachLoginForm.value;
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.handleLoginResponse(response, returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.status === 401
          ? 'Invalid email or password.'
          : 'Something went wrong. Please try again.');
      }
    });
  }
}
