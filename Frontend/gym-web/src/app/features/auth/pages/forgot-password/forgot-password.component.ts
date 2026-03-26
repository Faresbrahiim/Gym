import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { emailValidators } from '../../../../shared/validators/email.validator';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule, AuthCardComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  forgotPasswordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', emailValidators]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    // Service call will be wired in next phase
  }
}
