import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const membershipRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-membership/my-membership.component').then(m => m.MyMembershipComponent)
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./pages/plans-catalog/plans-catalog.component').then(m => m.PlansCatalogComponent)
  },
  {
    path: 'checkout/:planId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'status/:subscriptionId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/status/status.component').then(m => m.StatusComponent)
  }
];
