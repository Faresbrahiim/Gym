import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Exercise } from '../../models/workout.model';
import { environment } from '../../../../../environments/environment.prod';

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
  // Extract just the filename, e.g. "0012.gif"
  const filename = this.exercise?.gifUrl?.split('/').pop();
  return `/workout-gifs/${filename}`;
}
  onGifError(): void {
    this.gifError = true;
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.exercise.id);
  }

  get bodyPartLabel(): string {
    return this.exercise.bodyPart
      .split(' ')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  }
}
