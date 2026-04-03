import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public auth routes — no guard
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // Protected routes — require authentication
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },

  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/profile/profile.routes').then(m => m.profileRoutes)
  },

  {
    path: 'setup-2fa',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/setup-two-factor/setup-two-factor.component').then(m => m.SetupTwoFactorComponent)
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];
