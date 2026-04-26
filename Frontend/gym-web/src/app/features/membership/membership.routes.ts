import { Routes } from '@angular/router';
import { memberOnlyGuard } from '../../core/guards/member-only.guard';
import { memberOrGuestGuard } from '../../core/guards/member-or-guest.guard';

export const membershipRoutes: Routes = [
  {
    path: '',
    canActivate: [memberOnlyGuard],
    loadComponent: () =>
      import('./pages/my-membership/my-membership.component').then(m => m.MyMembershipComponent)
  },
  {
    path: 'plans',
    canActivate: [memberOrGuestGuard],
    loadComponent: () =>
      import('./pages/plans-catalog/plans-catalog.component').then(m => m.PlansCatalogComponent)
  },
  {
    path: 'checkout/:planId',
    canActivate: [memberOnlyGuard],
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'status/:subscriptionId',
    canActivate: [memberOnlyGuard],
    loadComponent: () =>
      import('./pages/status/status.component').then(m => m.StatusComponent)
  },
  {
    path: 'history',
    canActivate: [memberOnlyGuard],
    loadComponent: () =>
      import('./pages/subscription-history/subscription-history.component').then(m => m.SubscriptionHistoryComponent)
  }
];
