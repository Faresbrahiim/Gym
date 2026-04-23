import { Routes } from '@angular/router';

export const peopleRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/people/people.component').then(m => m.PeopleComponent)
  }
];
