import { Routes } from '@angular/router';

export const WORKOUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/workouts-browse/workouts-browse.component').then(
        (m) => m.WorkoutsBrowseComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/exercise-detail/exercise-detail.component').then(
        (m) => m.ExerciseDetailComponent
      ),
  },
];
