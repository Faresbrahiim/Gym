import { Component, OnInit, OnDestroy } from '@angular/core';
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
  // ── State ──────────────────────────────────────────────────────────────
  exercises: Exercise[] = [];
  bodyParts: string[] = [];
  targets: string[] = [];
  equipmentList: string[] = [];

  // ── Filters ───────────────────────────────────────────────────────────
  selectedBodyPart = '';
  selectedTarget = '';
  selectedEquipment = '';
  searchName = '';

  // ── Pagination ────────────────────────────────────────────────────────
  limit = 12;
  offset = 0;
  hasMore = true;

  // ── UI ────────────────────────────────────────────────────────────────
  loading = false;
  error = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private workoutService: WorkoutService, private router: Router) {}

  ngOnInit(): void {
    // Load filter dropdown data in parallel
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
        },
      });

    // Debounce name search
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.resetAndLoad());

    this.loadExercises();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────────
  loadExercises(): void {
  this.loading = true;
  this.error = '';

  // Free plan: avoid /search endpoint, use individual filter endpoints instead
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
      // Handle both array and { data: [] } response shapes
      const arr: Exercise[] = Array.isArray(results) ? results : (results?.data ?? []);
        console.log('gifUrl sample:', arr[0]?.gifUrl); // 👈 add this
      this.exercises = this.offset === 0 ? arr : [...this.exercises, ...arr];
      this.hasMore = arr.length === this.limit;
      this.loading = false;
    },
    error: () => {
      this.error = 'Failed to load exercises. Please try again.';
      this.loading = false;
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

  // ── Filter Handlers ───────────────────────────────────────────────────
  onFilterChange(): void {
    this.resetAndLoad();
  }
selectBodyPart(bp: string): void {
  // toggle off if same
  this.selectedBodyPart = this.selectedBodyPart === bp ? '' : bp;
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

  // ── Navigation ────────────────────────────────────────────────────────
  onViewDetails(exerciseId: string): void {
    this.router.navigate(['/workouts', exerciseId]);
  }
}
