import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { CreateMemberRequest } from '../models/create-member-request.model';
import { CreateCoachRequest } from '../models/create-coach-request.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {

  private readonly BASE = '/api/admin/users';

  constructor(private api: ApiService) {}

  createMember(dto: CreateMemberRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`${this.BASE}/member`, dto);
  }

  createCoach(dto: CreateCoachRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`${this.BASE}/coach`, dto);
  }
}
