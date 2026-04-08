import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
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
import { ErrorService } from '../../../../core/services/error.service';
import { LoginRequest } from '../../../../shared/models/auth/login-request.model';

declare const google: any;

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, AuthBannerComponent, AuthCardComponent, LoadingButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

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
    private errorService: ErrorService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userLoginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', Validators.required],
      rememberPassword: [false]
    });

    this.coachLoginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', Validators.required],
      rememberPassword: [false]
    });
  }

ngOnInit(): void {
  this.initializeGoogleLogin();

  const savedEmail = localStorage.getItem('rememberedEmail');

  if (savedEmail) {
    this.userLoginForm.patchValue({
      email: savedEmail,
      rememberPassword: true
    });

    this.coachLoginForm.patchValue({
      email: savedEmail,
      rememberPassword: true
    });
  }
}
  private initializeGoogleLogin(): void {
  google.accounts.id.initialize({
  client_id: '863501968602-m5op5onnboc6pv7abk0d3bhdncqt8ffb.apps.googleusercontent.com',
  callback: (response: any) => this.handleGoogleResponse(response)
  });

    // Render buttons into custom placeholders
    const userBtn = document.getElementById('google-user-btn');
    const coachBtn = document.getElementById('google-coach-btn');

    if (userBtn) {
      google.accounts.id.renderButton(userBtn, { theme: 'outline', size: 'large', width: '250' });
    }
    if (coachBtn) {
      google.accounts.id.renderButton(coachBtn, { theme: 'outline', size: 'large', width: '250' });
    }
  }

  private handleGoogleResponse(response: any): void {
  if (!response?.credential) return;

  this.isLoading.set(true);
  this.errorMessage.set(null);

  this.authService.loginWithGoogle({ token: response.credential }).subscribe({
    next: (res) => {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
      this.handleLoginResponse(res, returnUrl);
    },
    error: (err) => {
      this.isLoading.set(false);
      this.errorMessage.set(this.errorService.extractMessage(err));
    }
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

    if (role === 'ADMIN') {
      this.isLoading.set(false);
      this.router.navigate(['/admin/dashboard']);
      return;
    }

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
    const { email, rememberPassword } = this.userLoginForm.value;

    if (rememberPassword) {
    localStorage.setItem('rememberedEmail', email);
    } else {
    localStorage.removeItem('rememberedEmail');
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.userLoginForm.value;
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    this.authService.login(credentials).subscribe({
      next: (response) => this.handleLoginResponse(response, returnUrl),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 401
            ? 'Invalid email or password.'
            : this.errorService.extractMessage(err)
        );
      }
    });
  }

  onCoachLoginSubmit(): void {
    if (this.isLoading()) return;
    if (this.coachLoginForm.invalid) {
      this.coachLoginForm.markAllAsTouched();
      return;
    }
    const { email, rememberPassword } = this.coachLoginForm.value;

    if (rememberPassword) {
    localStorage.setItem('rememberedEmail', email);
    } else {
    localStorage.removeItem('rememberedEmail');
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.coachLoginForm.value;
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    this.authService.login(credentials).subscribe({
      next: (response) => this.handleLoginResponse(response, returnUrl),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 401
            ? 'Invalid email or password.'
            : this.errorService.extractMessage(err)
        );
      }
    });
  }
}
