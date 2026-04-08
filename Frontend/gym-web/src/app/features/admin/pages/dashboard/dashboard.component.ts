import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenService } from '../../../../core/auth/token.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  private readonly tokenService = inject(TokenService);

  adminName = this.tokenService.getEmail() ?? 'Admin';
}
