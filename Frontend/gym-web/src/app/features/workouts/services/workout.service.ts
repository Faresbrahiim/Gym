import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Exercise,
  SimilarExercise,
  AlternativeExercise,
  CalorieBurnResult,
  ExerciseFilters,
}
from '../models/workout.model';

import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  private readonly baseUrl = 'https://api.workoutxapp.com/v1/exercises';
  private readonly apiKey = environment.workoutxApiKey;

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'X-WorkoutX-Key': this.apiKey });
  }

  // ── List all exercises (paginated) ──────────────────────────────────────
  getExercises(limit = 10, offset = 0): Observable<Exercise[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<Exercise[]>(this.baseUrl, {
      headers: this.headers,
      params,
    });
  }

  // ── Get single exercise by ID ────────────────────────────────────────────
  getExerciseById(id: string): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.baseUrl}/exercise/${id}`, {
      headers: this.headers,
    });
  }

  // ── Filter by body part ──────────────────────────────────────────────────
  getByBodyPart(
    bodyPart: string,
    limit = 10,
    offset = 0
  ): Observable<Exercise[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<Exercise[]>(
      `${this.baseUrl}/bodyPart/${encodeURIComponent(bodyPart)}`,
      { headers: this.headers, params }
    );
  }

  // ── Filter by target muscle ──────────────────────────────────────────────
  getByTarget(target: string, limit = 10, offset = 0): Observable<Exercise[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<Exercise[]>(
      `${this.baseUrl}/target/${encodeURIComponent(target)}`,
      { headers: this.headers, params }
    );
  }

  // ── Filter by equipment ──────────────────────────────────────────────────
  getByEquipment(
    equipment: string,
    limit = 10,
    offset = 0
  ): Observable<Exercise[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<Exercise[]>(
      `${this.baseUrl}/equipment/${encodeURIComponent(equipment)}`,
      { headers: this.headers, params }
    );
  }

  // ── Search by name (partial, case-insensitive) ───────────────────────────
  searchByName(name: string): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.baseUrl}/name/${encodeURIComponent(name)}`,
      { headers: this.headers }
    );
  }

  // ── Multi-filter search (Basic plan+) ────────────────────────────────────
  searchExercises(filters: ExerciseFilters): Observable<Exercise[]> {
    let params = new HttpParams();
    if (filters.bodyPart) params = params.set('bodyPart', filters.bodyPart);
    if (filters.target) params = params.set('target', filters.target);
    if (filters.equipment) params = params.set('equipment', filters.equipment);
    if (filters.name) params = params.set('name', filters.name);
    if (filters.limit != null)
      params = params.set('limit', filters.limit.toString());
    if (filters.offset != null)
      params = params.set('offset', filters.offset.toString());
    return this.http.get<Exercise[]>(`${this.baseUrl}/search`, {
      headers: this.headers,
      params,
    });
  }

  // ── Lookup lists for dropdowns ───────────────────────────────────────────
  getBodyPartList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/bodyPartList`, {
      headers: this.headers,
    });
  }

  getTargetList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/targetList`, {
      headers: this.headers,
    });
  }

  getEquipmentList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/equipmentList`, {
      headers: this.headers,
    });
  }

  // ── Smart endpoints ───────────────────────────────────────────────────────
  getSimilarExercises(
    id: string,
    limit = 10,
    offset = 0
  ): Observable<{ total: number; count: number; data: SimilarExercise[] }> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<{
      total: number;
      count: number;
      data: SimilarExercise[];
    }>(`${this.baseUrl}/${id}/similar`, { headers: this.headers, params });
  }

  getAlternativeExercises(
    id: string,
    equipment?: string,
    excludeEquipment?: string,
    limit = 10
  ): Observable<{
    total: number;
    count: number;
    data: AlternativeExercise[];
  }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (equipment) params = params.set('equipment', equipment);
    if (excludeEquipment)
      params = params.set('excludeEquipment', excludeEquipment);
    return this.http.get<{
      total: number;
      count: number;
      data: AlternativeExercise[];
    }>(`${this.baseUrl}/${id}/alternatives`, { headers: this.headers, params });
  }

  getCalorieBurn(
    id: string,
    weightKg = 70,
    minutes = 10
  ): Observable<CalorieBurnResult> {
    const params = new HttpParams()
      .set('weightKg', weightKg.toString())
      .set('minutes', minutes.toString());
    return this.http.get<CalorieBurnResult>(`${this.baseUrl}/${id}/calories`, {
      headers: this.headers,
      params,
    });
  }
}
