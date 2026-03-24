import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [RouterLink, AuthCardComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  showPassword = false;
  showConfirmPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
