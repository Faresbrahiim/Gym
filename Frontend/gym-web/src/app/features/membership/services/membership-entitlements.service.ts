import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { TokenService } from '../../../core/auth/token.service';
import { MembershipEntitlements } from '../models/membership-entitlements.model';

const EMPTY_ENTITLEMENTS: MembershipEntitlements = {
  sessionBookingAllowed: false,
  sessionBookingReason: null,
  aiCoachAllowed: false,
  aiCoachReason: null,
  capabilities: [],
};

@Injectable({ providedIn: 'root' })
export class MembershipEntitlementsService {
  private readonly BASE = '/api/subscriptions/me/entitlements';
  private readonly api = inject(ApiService);
  private readonly tokenService = inject(TokenService);

  readonly entitlements = signal<MembershipEntitlements | null>(null);
  readonly loaded = signal(false);
  readonly loading = signal(false);

  private loadedForUserId: string | null = null;

  load(force = false): Observable<MembershipEntitlements> {
    const userId = this.tokenService.getUserId();
    const role = this.tokenService.getRole();

    if (!userId || role !== 'MEMBER') {
      this.loadedForUserId = null;
      this.entitlements.set(EMPTY_ENTITLEMENTS);
      this.loaded.set(true);
      return of(EMPTY_ENTITLEMENTS);
    }

    const cached = this.entitlements();
    if (!force && this.loaded() && this.loadedForUserId === userId && cached) {
      return of(cached);
    }

    this.loading.set(true);

    return this.api.get<MembershipEntitlements>(this.BASE).pipe(
      tap(entitlements => {
        this.entitlements.set(entitlements);
        this.loadedForUserId = userId;
        this.loaded.set(true);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  invalidate(): void {
    this.loadedForUserId = null;
    this.entitlements.set(null);
    this.loaded.set(false);
    this.loading.set(false);
  }
}
