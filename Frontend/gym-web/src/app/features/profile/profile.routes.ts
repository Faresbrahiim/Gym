import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    // /profile — read-only overview
    path: '',
    loadComponent: () =>
      import('./pages/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
  },
  {
    // /profile/edit — editable form (existing page, preserved)
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  }
  // NOTE: /profile/onboarding is intentionally kept as a top-level route in app.routes.ts
  // because it must render outside MainLayout (full-screen, no header/footer).
];
