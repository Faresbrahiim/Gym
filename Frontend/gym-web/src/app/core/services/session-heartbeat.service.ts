import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subscription, EMPTY } from 'rxjs';
import { filter, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { TokenService } from '../auth/token.service';

const HEARTBEAT_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class SessionHeartbeatService implements OnDestroy {
  private sub: Subscription | null = null;

  constructor(
    private api: ApiService,
    private tokenService: TokenService
  ) {}

  start(): void {
    if (this.sub) return;

    this.sub = interval(HEARTBEAT_INTERVAL_MS).pipe(
      filter(() => this.tokenService.isAuthenticated()),
      switchMap(() =>
        this.api.get<unknown>('/api/users/me').pipe(
          // Errors are handled by the auth interceptor:
          // 401 → refresh attempt → if refresh fails → clearTokens + navigate('/login').
          // catchError here just prevents the interval from terminating on failure.
          catchError(() => EMPTY)
        )
      )
    ).subscribe();
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
