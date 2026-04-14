import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const chatRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/chat/chat.component').then(m => m.ChatComponent)
  }
];
