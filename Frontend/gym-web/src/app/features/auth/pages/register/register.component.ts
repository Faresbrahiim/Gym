import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [RouterLink, AuthBannerComponent, AuthCardComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  showUserPassword = false;
  showUserConfirmPassword = false;
  showCoachPassword = false;
  showCoachConfirmPassword = false;

  toggleUserPassword(): void {
    this.showUserPassword = !this.showUserPassword;
  }

  toggleUserConfirmPassword(): void {
    this.showUserConfirmPassword = !this.showUserConfirmPassword;
  }

  toggleCoachPassword(): void {
    this.showCoachPassword = !this.showCoachPassword;
  }

  toggleCoachConfirmPassword(): void {
    this.showCoachConfirmPassword = !this.showCoachConfirmPassword;
  }
}
