import { Injectable, signal } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { UserMe } from '../../features/profile/models/user-me.model';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

/**
 * Single owner of authenticated user state (avatar, username, raw UserMe).
 * Lives in core/ so any feature or layout can consume it without boundary violations.
 * Hydrated once at app boot (App.ngOnInit) and re-hydrated after profile mutations.
 * please to inform me before making nay modification here . Author -> Anassbia
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {

  private readonly BASE = '/api/users/me';

  readonly currentAvatarUrl = signal<string>(DEFAULT_AVATAR);
  readonly currentUsername   = signal<string>('');

  private meCache$: Observable<UserMe> | null = null;

  constructor(private api: ApiService) {}

  getMe(): Observable<UserMe> {
    if (!this.meCache$) {
      this.meCache$ = this.api.get<UserMe>(this.BASE).pipe(
        tap(me => {
          if (me.profile?.profilePictureUrl) {
            this.currentAvatarUrl.set(me.profile.profilePictureUrl);
          }
          if (me.username) {
            this.currentUsername.set(me.username);
          }
        }),
        shareReplay(1)
      );
    }
    return this.meCache$;
  }

  /** Fire-and-forget hydration — safe to call without caring about the result. */
  hydrate(): void {
    this.getMe().pipe(catchError(() => EMPTY)).subscribe();
  }

  invalidateCache(): void {
    this.meCache$ = null;
  }

  /** Called on logout — resets all state. */
  clearSession(): void {
    this.meCache$ = null;
    this.currentAvatarUrl.set(DEFAULT_AVATAR);
    this.currentUsername.set('');
  }
}
