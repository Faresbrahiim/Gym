import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [RouterLink, AuthCardComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {}
