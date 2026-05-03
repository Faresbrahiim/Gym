export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
  instructions?: string[];
  secondaryMuscles?: string[];
}

export interface SimilarExercise {
  id: string;
  name: string;
  target: string;
  equipment: string;
  similarityScore: number;
}

export interface AlternativeExercise {
  id: string;
  name: string;
  target: string;
  equipment: string;
  alternativeScore: number;
}

export interface PaginatedExercises<T> {
  total?: number;
  count?: number;
  data: T[];
}

export interface CalorieBurnResult {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  weightKg: number;
  minutes: number;
  baseKcalPerMin: number;
  kcalPerMin: number;
  totalKcal: number;
}

export interface ExerciseFilters {
  bodyPart?: string;
  target?: string;
  equipment?: string;
  name?: string;
  limit?: number;
  offset?: number;
}
