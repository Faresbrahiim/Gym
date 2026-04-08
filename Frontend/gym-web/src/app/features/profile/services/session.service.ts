import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { Session } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionService {

  private readonly BASE = '/api/auth';

  constructor(private api: ApiService) {}

  getSessions(): Observable<Session[]> {
    return this.api.get<Session[]>(`${this.BASE}/sessions`);
  }

  revokeSession(tokenId: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`${this.BASE}/sessions/${tokenId}/revoke`, {});
  }
}
