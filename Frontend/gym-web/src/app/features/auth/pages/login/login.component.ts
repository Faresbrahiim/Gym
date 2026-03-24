import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthBannerComponent } from '../../../../shared/components/auth-banner/auth-banner.component';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [RouterLink, AuthBannerComponent, AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  showUserPassword = false;
  showCoachPassword = false;

  toggleUserPassword(): void {
    this.showUserPassword = !this.showUserPassword;
  }

  toggleCoachPassword(): void {
    this.showCoachPassword = !this.showCoachPassword;
  }
}
