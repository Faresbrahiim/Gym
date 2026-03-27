import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-home',
  template: `
    <p>Home — placeholder</p>
    <button class="btn btn-danger" (click)="onLogout()">Logout</button>
  `
})
export class HomeComponent {

  constructor(private authService: AuthService, private router: Router) {}

  onLogout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
