import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Subscription } from '../models/subscription.model';
import { SubscriptionHistoryEntry } from '../models/subscription-history-entry.model';
import { ACTIVE_STATUSES } from '../models/subscription-status.enum';
import { PagedResponse } from '../../../core/models/paged-response.model';
import { MembershipEntitlementsService } from './membership-entitlements.service';

@Injectable({ providedIn: 'root' })
export class MembershipService {

  private readonly BASE = '/api/subscriptions';

  private readonly api = inject(ApiService);
  private readonly entitlementsService = inject(MembershipEntitlementsService);

  // Cached state — pages subscribe here; invalidated after every mutation.
  readonly currentSubscription$ = new BehaviorSubject<Subscription | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────

  getMySubscriptions(): Observable<Subscription[]> {
    return this.api.get<Subscription[]>(`${this.BASE}/me`);
  }

  getMySubscriptionHistory(page = 1, pageSize = 10): Observable<PagedResponse<SubscriptionHistoryEntry>> {
    return this.api.get<PagedResponse<SubscriptionHistoryEntry>>(`${this.BASE}/me/history`, {
      params: { page, pageSize }
    });
  }

  // Derives the "current" subscription: first with an active-ish status,
  // falling back to the first terminal one, or null when the list is empty.
  getCurrentSubscription(): Observable<Subscription | null> {
    return this.getMySubscriptions().pipe(
      map(subs => {
        const active = subs.find(s => ACTIVE_STATUSES.includes(s.status));
        if (active) return active;
        return subs.length > 0 ? subs[0] : null;
      }),
      tap(sub => this.currentSubscription$.next(sub))
    );
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  create(planId: string): Observable<Subscription> {
    return this.api.post<Subscription>(this.BASE, { planId }).pipe(
      tap(() => this.invalidate())
    );
  }

  cancel(subscriptionId: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${subscriptionId}/cancel`, {}).pipe(
      tap(() => this.invalidate())
    );
  }

  activateFree(): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/me/free`, {}).pipe(
      tap(() => this.invalidate())
    );
  }

  pause(subscriptionId: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${subscriptionId}/pause`, {}).pipe(
      tap(() => this.invalidate())
    );
  }

  resume(subscriptionId: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${subscriptionId}/resume`, {}).pipe(
      tap(() => this.invalidate())
    );
  }

  renew(subscriptionId: string): Observable<Subscription> {
    return this.api.post<Subscription>(`${this.BASE}/${subscriptionId}/renew`, {}).pipe(
      tap(() => this.invalidate())
    );
  }

  changePlan(subscriptionId: string, newPlanId: string): Observable<Subscription> {
    return this.api.post<Subscription>(
      `${this.BASE}/${subscriptionId}/change-plan?newPlanId=${newPlanId}`,
      {}
    ).pipe(tap(() => this.invalidate()));
  }

  upgrade(subscriptionId: string, newPlanId: string): Observable<Subscription> {
    return this.api.post<Subscription>(
      `${this.BASE}/${subscriptionId}/upgrade?newPlanId=${newPlanId}`,
      {}
    ).pipe(tap(() => this.invalidate()));
  }

  downgrade(subscriptionId: string, newPlanId: string): Observable<Subscription> {
    return this.api.post<Subscription>(
      `${this.BASE}/${subscriptionId}/downgrade?newPlanId=${newPlanId}`,
      {}
    ).pipe(tap(() => this.invalidate()));
  }

  // ── Cache ────────────────────────────────────────────────────────────────────

  // Call after any mutation to signal that the next read should re-fetch.
  invalidate(): void {
    this.currentSubscription$.next(null);
    this.entitlementsService.invalidate();
  }
}
