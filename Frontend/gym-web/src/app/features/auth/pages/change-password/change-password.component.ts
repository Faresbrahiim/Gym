import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { strongPasswordValidators, passwordMatchValidator } from '../../../../shared/validators/password.validator';
import { PasswordRulesComponent } from '../../../../shared/components/password-rules/password-rules.component';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [RouterLink, ReactiveFormsModule, AuthCardComponent, PasswordRulesComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {

  showPassword = false;
  showConfirmPassword = false;

  changePasswordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group({
      password:        ['', strongPasswordValidators],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  togglePassword(): void        { this.showPassword        = !this.showPassword;        }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    // Service call will be wired in next phase
  }
}
