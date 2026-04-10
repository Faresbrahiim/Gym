import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { rootGuard } from './core/guards/root.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [rootGuard],
    children: []
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
        // Products feature
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then(m => m.productsRoutes)
      },
      {
        // Cart feature
        path: 'cart',
        loadChildren: () =>
          import('./features/cart/cart.routes').then(m => m.cartRoutes)
      },
      {
        // Checkout feature
        path: 'checkout',
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then(m => m.checkoutRoutes)
      },
      {
        // Orders feature
        path: 'orders',
        loadChildren: () =>
          import('./features/orders/orders.routes').then(m => m.ordersRoutes)
      },
      {
        // Profile feature — delegates to profile.routes.ts
        // authGuard here covers all child routes (/profile and /profile/edit)
        path: 'profile',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.profileRoutes)
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

  // Admin panel — protected by authGuard + permissionGuard (role: ADMIN)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, permissionGuard],
    data: { role: 'ADMIN' },
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },

  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
