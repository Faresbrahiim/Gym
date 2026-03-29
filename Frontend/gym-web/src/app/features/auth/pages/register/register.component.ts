import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { PasswordRulesComponent } from '../../../../shared/components/password-rules/password-rules.component';
import { emailValidators } from '../../../../shared/validators/email.validator';
import { strongPasswordValidators, passwordMatchValidator } from '../../../../shared/validators/password.validator';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../../../shared/models/auth/register-request.model';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, AuthBannerComponent, AuthCardComponent, LoadingButtonComponent, PasswordRulesComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  showPassword        = false;
  showConfirmPassword = false;

  isLoading           = signal(false);
  errorMessage        = signal<string | null>(null);
  registrationSuccess = signal(false);

  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      firstName:       ['', Validators.required],
      lastName:        ['', Validators.required],
      username:        ['', Validators.required],
      email:           ['', emailValidators],
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  togglePassword():        void { this.showPassword        = !this.showPassword;        }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

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
        this.errorMessage.set(err?.status === 409
          ? 'Email or username already exists.'
          : 'Registration failed. Please try again.');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
