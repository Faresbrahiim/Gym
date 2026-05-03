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
        // Profile feature — delegates to profile.routes.ts
        // authGuard here covers all child routes (/profile and /profile/edit)
        path: 'profile',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.profileRoutes)
      },
      {
        path: 'membership',
        loadChildren: () =>
          import('./features/membership/membership.routes').then(m => m.membershipRoutes)
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./features/payments/payments.routes').then(m => m.paymentsRoutes)
      },
      {
        path: 'people',
        loadChildren: () =>
          import('./features/people/people.routes').then(m => m.peopleRoutes)
      },
      {
        path: 'chat',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/chat/chat.routes').then(m => m.chatRoutes)
      },
      {
        path: 'store',
        loadChildren: () =>
          import('./features/products/products.routes').then(m => m.productsRoutes)
      },
      {
        path: 'cart',
        loadChildren: () =>
          import('./features/cart/cart.routes').then(m => m.cartRoutes)
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then(m => m.checkoutRoutes)
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/orders/orders.routes').then(m => m.ordersRoutes)
      },
      {
        path: 'bookings',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/bookings/bookings.routes').then(m => m.bookingsRoutes)
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

  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
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

  {
  path: 'workouts',
  loadChildren: () =>
    import('./features/workouts/workouts.routes').then(m => m.WORKOUT_ROUTES),
  },
  // Chat feature — protected, no layout (full-screen chat interface)
  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
