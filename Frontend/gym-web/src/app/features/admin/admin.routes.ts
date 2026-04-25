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
    path: 'subscriptions',
    loadComponent: () =>
      import('./pages/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/admin-profile.component').then(m => m.AdminProfileComponent)
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./pages/plans/plans.component').then(m => m.PlansComponent)
  },
  {
    path: 'products',
    loadComponent: () =>
      import('../products/pages/admin-products-list/admin-products-list.component').then(m => m.AdminProductsListComponent)
  }
];
