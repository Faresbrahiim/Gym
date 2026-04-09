import { Component, signal, inject, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TokenService } from '../../core/auth/token.service';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  sidebarCollapsed = signal(false);

  private readonly tokenService = inject(TokenService);
  private readonly authService  = inject(AuthService);
  private readonly router       = inject(Router);

  adminEmail = signal(this.tokenService.getEmail() ?? 'Admin');

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login'])
    });
  }
}
