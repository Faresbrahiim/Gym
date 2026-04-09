import { Routes } from '@angular/router';
import { publicGuard } from '../../core/guards/public.guard';
import { twoFactorGuard } from '../../core/guards/two-factor.guard';

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
    loadComponent: () =>
      import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./pages/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'verify-2fa',
    canActivate: [twoFactorGuard],
    loadComponent: () =>
      import('./pages/verify-two-factor/verify-two-factor.component').then(m => m.VerifyTwoFactorComponent)
  },
  {
    // No guard — invited user arrives unauthenticated via email link
    path: 'setup-password',
    loadComponent: () =>
      import('./pages/setup-password/setup-password.component').then(m => m.SetupPasswordComponent)
  }
];
