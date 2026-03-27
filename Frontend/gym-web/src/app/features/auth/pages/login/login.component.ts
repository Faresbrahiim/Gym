import { Component, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { emailValidators } from '../../../../shared/validators/email.validator';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../../../core/auth/token.service';
import { LoginRequest } from '../../../../shared/models/auth/login-request.model';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, AuthBannerComponent, AuthCardComponent],
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

  constructor(private fb: FormBuilder, private authService: AuthService, private tokenService: TokenService, private router: Router, private route: ActivatedRoute) {
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

  onUserLoginSubmit(): void {
    if (this.isLoading()) return;
    if (this.userLoginForm.invalid) {
      this.userLoginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.userLoginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.accessToken && response.refreshToken) {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set('Something went wrong. Please try again.');
        }
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

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.accessToken && response.refreshToken) {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set('Something went wrong. Please try again.');
        }
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
