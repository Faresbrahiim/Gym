import { Routes } from '@angular/router';

export const cartRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cart-list/cart-list.component').then(m => m.CartListComponent)
  }
];
