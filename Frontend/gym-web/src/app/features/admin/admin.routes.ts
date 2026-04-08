import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'users/invite',
    loadComponent: () =>
      import('./pages/users/invite-user/invite-user.component').then(m => m.InviteUserComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/admin-profile.component').then(m => m.AdminProfileComponent)
  }
];
