import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { Plan } from '../../membership/models/plan.model';

export interface PlanCreateDTO {
  name: string;
  description: string | null;
  price: number;
  durationInDays: number | null;
  features?: string[];
}

export interface PlanUpdateDTO {
  name: string | null;
  description: string | null;
  price: number | null;
  durationInDays: number | null;
  status: 'ACTIVE' | 'INACTIVE' | null;
  features?: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminPlanService {

  private readonly BASE = '/api/plans/admin';
  private readonly api  = inject(ApiService);

  create(dto: PlanCreateDTO): Observable<Plan> {
    return this.api.post<Plan>(this.BASE, dto);
  }

  update(planId: string, dto: PlanUpdateDTO): Observable<Plan> {
    return this.api.put<Plan>(`${this.BASE}/${planId}`, dto);
  }

  delete(planId: string): Observable<void> {
    return this.api.delete<void>(`${this.BASE}/${planId}`);
  }

  enable(planId: string): Observable<Plan> {
    return this.api.patch<Plan>(`${this.BASE}/${planId}/enable`, {});
  }

  disable(planId: string): Observable<Plan> {
    return this.api.patch<Plan>(`${this.BASE}/${planId}/disable`, {});
  }
}
