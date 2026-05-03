import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';

import { WorkoutService } from '../../services/workout.service';
import { Exercise } from '../../models/workout.model';
import { ExerciseCardComponent } from '../../components/exercise-card/exercise-card.component';

@Component({
  selector: 'app-workouts-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, ExerciseCardComponent],
  templateUrl: './workouts-browse.component.html',
  styleUrls: ['./workouts-browse.component.css'],
})
export class WorkoutsBrowseComponent implements OnInit, OnDestroy {
  exercises: Exercise[] = [];
  bodyParts: string[] = [];
  targets: string[] = [];
  equipmentList: string[] = [];

  selectedBodyPart = '';
  selectedTarget = '';
  selectedEquipment = '';
  searchName = '';

  limit = 12;
  offset = 0;
  hasMore = true;

  loading = false;
  error = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private workoutService: WorkoutService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    forkJoin({
      bodyParts: this.workoutService.getBodyPartList(),
      targets: this.workoutService.getTargetList(),
      equipmentList: this.workoutService.getEquipmentList(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bodyParts, targets, equipmentList }) => {
          this.bodyParts = bodyParts;
          this.targets = targets;
          this.equipmentList = equipmentList;
          this.cdr.detectChanges();
        },
        error: () => {},
      });

    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.resetAndLoad());

    this.loadExercises();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadExercises(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    let request$;

    if (this.searchName) {
      request$ = this.workoutService.searchByName(this.searchName);
    } else if (this.selectedBodyPart) {
      request$ = this.workoutService.getByBodyPart(this.selectedBodyPart, this.limit, this.offset);
    } else if (this.selectedTarget) {
      request$ = this.workoutService.getByTarget(this.selectedTarget, this.limit, this.offset);
    } else if (this.selectedEquipment) {
      request$ = this.workoutService.getByEquipment(this.selectedEquipment, this.limit, this.offset);
    } else {
      request$ = this.workoutService.getExercises(this.limit, this.offset);
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: any) => {
        const arr: Exercise[] = Array.isArray(results) ? results : (results?.data ?? []);
        this.exercises = this.offset === 0 ? arr : [...this.exercises, ...arr];
        this.hasMore = arr.length === this.limit;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load exercises. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  resetAndLoad(): void {
    this.offset = 0;
    this.exercises = [];
    this.loadExercises();
  }

  loadMore(): void {
    this.offset += this.limit;
    this.loadExercises();
  }

  selectBodyPart(bp: string): void {
    this.selectedBodyPart = this.selectedBodyPart === bp ? '' : bp;
    this.cdr.detectChanges();
    this.resetAndLoad();
  }

  onFilterChange(): void {
    this.resetAndLoad();
  }

  onSearchInput(value: string): void {
    this.searchName = value;
    this.searchSubject.next(value);
  }

  clearFilters(): void {
    this.selectedBodyPart = '';
    this.selectedTarget = '';
    this.selectedEquipment = '';
    this.searchName = '';
    this.cdr.detectChanges();
    this.resetAndLoad();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.selectedBodyPart ||
      this.selectedTarget ||
      this.selectedEquipment ||
      this.searchName
    );
  }

  // ── Helpers ────────────────────────────────────────────
  getGifUrl(exercise: any): string {
    const filename = exercise?.gifUrl?.split('/').pop();
    return `/workout-gifs/${filename}`;
  }

  onGifError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.nextElementSibling as HTMLElement;
    if (fallback) fallback.style.display = 'flex';
  }

  onViewDetails(exerciseId: string): void {
    this.router.navigate(['/workouts', exerciseId]);
  }
}
