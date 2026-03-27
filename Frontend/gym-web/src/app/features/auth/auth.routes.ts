import { Routes } from '@angular/router';
import { publicGuard } from '../../core/guards/public.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'change-password',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  }
];
