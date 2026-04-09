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

  showPassword = false;
  isLoading    = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;

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
    this.loginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.initializeGoogleLogin();
  }

  private initializeGoogleLogin(): void {
    google.accounts.id.initialize({
      client_id: '863501968602-m5op5onnboc6pv7abk0d3bhdncqt8ffb.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleResponse(response)
    });

    const btn = document.getElementById('google-btn');
    if (btn) {
      google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', width: '250' });
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

  togglePassword(): void { this.showPassword = !this.showPassword; }

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

  onSubmit(): void {
    if (this.isLoading()) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.loginForm.value;
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
