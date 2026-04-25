import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { PagedResponse } from '../../../core/models/paged-response.model';
import { Subscription } from '../../membership/models/subscription.model';
import { AdminSubscriptionSummary } from '../models/admin-subscription-summary.model';

@Injectable({ providedIn: 'root' })
export class AdminSubscriptionService {

  private readonly api  = inject(ApiService);
  private readonly BASE = '/api/admin/subscriptions';

  getAll(page = 1, pageSize = 10, status = 'ALL', search = ''): Observable<PagedResponse<Subscription>> {
    return this.api.get<PagedResponse<Subscription>>(this.BASE, {
      params: {
        page,
        pageSize,
        status,
        search: search.trim() || null
      }
    });
  }

  getSummary(): Observable<AdminSubscriptionSummary> {
    return this.api.get<AdminSubscriptionSummary>(`${this.BASE}/summary`);
  }

  getUserSubscriptions(userId: string): Observable<Subscription[]> {
    return this.api.get<Subscription[]>(`${this.BASE}/users/${userId}`);
  }

  activate(id: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${id}/activate`, {});
  }

  cancel(id: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${id}/cancel`, {});
  }

  freeze(id: string, freezeEnd: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${id}/freeze?freezeEnd=${encodeURIComponent(freezeEnd)}`, {});
  }

  extend(id: string, extraDays: number): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${id}/extend?extraDays=${extraDays}`, {});
  }

  approvePause(id: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${id}/pause/approve`, {});
  }

  rejectPause(id: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${id}/pause/reject`, {});
  }
}
