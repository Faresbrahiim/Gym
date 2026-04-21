import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const paymentsRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent),
    canActivate: [authGuard]
  },
  { 
    path: ':paymentId', 
    loadComponent: () => import('./pages/payment-detail/payment-detail.component').then(m => m.PaymentDetailComponent),
    canActivate: [authGuard]
  }
];
