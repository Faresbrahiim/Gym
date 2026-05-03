import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../services/workout.service';
import { CalorieBurnResult } from '../../models/workout.model';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.css'],
})
export class ExerciseDetailComponent implements OnInit {
  exercise: any = null;
  similarExercises: any[] = [];
  calorieBurn: CalorieBurnResult | null = null;

  weightKg = 70;
  minutes = 30;

  loading = true;
  error = '';
  gifError = false;

  constructor(
    private route: ActivatedRoute,
    private workoutService: WorkoutService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No exercise ID provided.';
      this.loading = false;
      return;
    }
    this.loadExercise(id);
  }

  loadExercise(id: string): void {
    this.loading = true;
    this.error = '';
    this.gifError = false;

    this.workoutService.getExerciseById(id).subscribe({
      next: (res: any) => {
        this.exercise = Array.isArray(res) ? res[0] : res?.data ?? res;
        this.loading = false;
        this.cdr.detectChanges();

        this.calculateCalories();

        this.workoutService.getSimilarExercises(id, 4).subscribe({
          next: (result: any) => {
            this.similarExercises = Array.isArray(result) ? result : result?.data ?? [];
            this.cdr.detectChanges();
          },
          error: () => {
            this.similarExercises = [];
          },
        });
      },
      error: () => {
        this.error = 'Exercise not found.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  calculateCalories(): void {
    if (!this.exercise) return;
    this.workoutService
      .getCalorieBurn(this.exercise.id, this.weightKg, this.minutes)
      .subscribe({
        next: (result) => {
          this.calorieBurn = result;
          this.cdr.detectChanges();
        },
        error: () => {
          this.calorieBurn = null;
        },
      });
  }

  get authenticatedGifUrl(): string {
    const filename = this.exercise?.gifUrl?.split('/').pop();
    return `/workout-gifs/${filename}`;
  }
}
