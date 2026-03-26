import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { emailValidators } from '../../../../shared/validators/email.validator';
import { strongPasswordValidators, passwordMatchValidator } from '../../../../shared/validators/password.validator';
import { PasswordRulesComponent } from '../../../../shared/components/password-rules/password-rules.component';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, AuthBannerComponent, AuthCardComponent, PasswordRulesComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  showUserPassword = false;
  showUserConfirmPassword = false;
  showCoachPassword = false;
  showCoachConfirmPassword = false;

  userRegisterForm: FormGroup;
  coachRegisterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userRegisterForm = this.fb.group({
      email:           ['', emailValidators],
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    this.coachRegisterForm = this.fb.group({
      email:           ['', emailValidators],
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  toggleUserPassword(): void        { this.showUserPassword        = !this.showUserPassword;        }
  toggleUserConfirmPassword(): void { this.showUserConfirmPassword  = !this.showUserConfirmPassword; }
  toggleCoachPassword(): void       { this.showCoachPassword       = !this.showCoachPassword;       }
  toggleCoachConfirmPassword(): void { this.showCoachConfirmPassword = !this.showCoachConfirmPassword; }

  onUserRegisterSubmit(): void {
    if (this.userRegisterForm.invalid) {
      this.userRegisterForm.markAllAsTouched();
      return;
    }
    // Service call will be wired in next phase
  }

  onCoachRegisterSubmit(): void {
    if (this.coachRegisterForm.invalid) {
      this.coachRegisterForm.markAllAsTouched();
      return;
    }
    // Service call will be wired in next phase
  }
}
