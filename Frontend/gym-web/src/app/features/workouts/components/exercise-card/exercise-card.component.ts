import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Exercise } from '../../models/workout.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exercise-card.component.html',
  styleUrls: ['./exercise-card.component.css'],
})
export class ExerciseCardComponent {
  @Input() exercise!: Exercise;
  @Output() viewDetails = new EventEmitter<string>();

  gifError = false;

  get authenticatedGifUrl(): string {
    const filename = (this.exercise as any)?.gifUrl?.split('/').pop();
    return `/workout-gifs/${filename}`;
  }

  onGifError(): void {
    this.gifError = true;
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.exercise.id);
  }
}
