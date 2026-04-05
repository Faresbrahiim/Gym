import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  // Root redirect — bare "/" goes to the public home landing page
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Public auth routes (login, register, forgot-password, etc.)
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // Routes inside MainLayout (header + footer)
  // /home is public; individual protected routes carry their own authGuard
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },

  // Onboarding — protected, no layout (full-screen first-time setup)
  {
    path: 'profile/onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },

  // 2FA setup — protected, no layout
  {
    path: 'setup-2fa',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/setup-two-factor/setup-two-factor.component').then(m => m.SetupTwoFactorComponent)
  },

  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
