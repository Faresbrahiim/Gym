import { Routes } from '@angular/router';
import { memberOnlyGuard } from '../../core/guards/member-only.guard';

export const paymentsRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent),
    canActivate: [memberOnlyGuard]
  },
  { 
    path: ':paymentId', 
    loadComponent: () => import('./pages/payment-detail/payment-detail.component').then(m => m.PaymentDetailComponent),
    canActivate: [memberOnlyGuard]
  }
];
