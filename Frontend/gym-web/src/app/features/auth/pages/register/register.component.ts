import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { PasswordRulesComponent } from '../../../../shared/components/password-rules/password-rules.component';
import { emailValidators } from '../../../../shared/validators/email.validator';
import { strongPasswordValidators, passwordMatchValidator } from '../../../../shared/validators/password.validator';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ErrorService } from '../../../../core/services/error.service';
import { RegisterRequest } from '../../../../shared/models/auth/register-request.model';

declare const google: any;

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AuthBannerComponent,
    AuthCardComponent,
    LoadingButtonComponent,
    PasswordRulesComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  showPassword        = false;
  showConfirmPassword = false;

  isLoading           = signal(false);
  errorMessage        = signal<string | null>(null);
  registrationSuccess = signal(false);

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private errorService: ErrorService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName:       ['', Validators.required],
      lastName:        ['', Validators.required],
      username:        ['', Validators.required],
      email:           ['', emailValidators],
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  // ✅ INIT GOOGLE (same as login)
  ngOnInit(): void {
    this.initializeGoogleRegister();
  }

  private initializeGoogleRegister(): void {
    google.accounts.id.initialize({
      client_id: '863501968602-m5op5onnboc6pv7abk0d3bhdncqt8ffb.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleResponse(response)
    });

    // same logic as login
    setTimeout(() => {
      const btn = document.getElementById('google-register-btn');

      if (btn) {
        google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: '250'
        });
      }
    });
  }

  // ✅ SAME HANDLER AS LOGIN
  private handleGoogleResponse(response: any): void {
    if (!response?.credential) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle({ token: response.credential }).subscribe({
      next: (res) => {
        this.isLoading.set(false);

        if (res.accessToken && res.refreshToken) {
          this.tokenService.setTokens(res.accessToken, res.refreshToken);
        }

        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.extractMessage(err));
      }
    });
  }

  // ---------------------------
  // NORMAL REGISTER LOGIC
  // ---------------------------
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.isLoading()) return;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { confirmPassword, ...payload } = this.registerForm.value;

    this.authService.register(payload as RegisterRequest).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.registrationSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.errorService.extractMessage(err));
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
