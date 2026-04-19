import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { Plan } from '../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlanService {

  private readonly BASE = '/api/plans';

  private readonly api = inject(ApiService);

  getActivePlans(): Observable<Plan[]> {
    return this.api.get<Plan[]>(`${this.BASE}/active`);
  }

  getAllPlans(): Observable<Plan[]> {
    return this.api.get<Plan[]>(this.BASE);
  }

  getPlan(id: string): Observable<Plan> {
    return this.api.get<Plan>(`${this.BASE}/${id}`);
  }
}
