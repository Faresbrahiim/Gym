import { Routes } from '@angular/router';

export const aiCoachRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ai-coach-chat/ai-coach-chat.component').then(m => m.AiCoachChatComponent)
  }
];
