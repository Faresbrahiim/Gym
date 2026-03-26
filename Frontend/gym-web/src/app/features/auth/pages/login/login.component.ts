import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { emailValidators } from '../../../../shared/validators/email.validator';
import { strongPasswordValidators } from '../../../../shared/validators/password.validator';

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

  userLoginForm: FormGroup;
  coachLoginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userLoginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', strongPasswordValidators]
    });

    this.coachLoginForm = this.fb.group({
      email:    ['', emailValidators],
      password: ['', strongPasswordValidators]
    });
  }

  toggleUserPassword(): void  { this.showUserPassword  = !this.showUserPassword;  }
  toggleCoachPassword(): void { this.showCoachPassword = !this.showCoachPassword; }

  onUserLoginSubmit(): void {
    if (this.userLoginForm.invalid) {
      this.userLoginForm.markAllAsTouched();
      return;
    }
    // Service call will be wired in next phase
  }

  onCoachLoginSubmit(): void {
    if (this.coachLoginForm.invalid) {
      this.coachLoginForm.markAllAsTouched();
      return;
    }
    // Service call will be wired in next phase
  }
}
