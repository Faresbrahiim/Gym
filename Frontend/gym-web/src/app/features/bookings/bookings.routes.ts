import { Routes } from '@angular/router';
import { memberOnlyGuard } from '../../core/guards/member-only.guard';
import { coachOnlyGuard } from '../../core/guards/coach-only.guard';

export const bookingsRoutes: Routes = [
  {
    path: 'sessions',
    canActivate: [memberOnlyGuard],
    loadComponent: () =>
      import('./pages/sessions-browse/sessions-browse.component').then(m => m.SessionsBrowseComponent)
  },
  {
    path: 'my',
    canActivate: [memberOnlyGuard],
    loadComponent: () =>
      import('./pages/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent)
  },
  {
    path: 'coach',
    canActivate: [coachOnlyGuard],
    loadComponent: () =>
      import('./pages/coach-sessions/coach-sessions.component').then(m => m.CoachSessionsComponent)
  },
  {
    path: 'coach/:sessionId',
    canActivate: [coachOnlyGuard],
    loadComponent: () =>
      import('./pages/coach-session-bookings/coach-session-bookings.component').then(m => m.CoachSessionBookingsComponent)
  }
];
