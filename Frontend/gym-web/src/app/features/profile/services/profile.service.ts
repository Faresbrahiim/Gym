import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { UserMe } from '../models/user-me.model';
import { UpdateProfileRequest } from '../models/update-profile-request.model';
import { UpdateMemberProfileRequest } from '../models/update-member-profile-request.model';
import { UpdateCoachProfileRequest } from '../models/update-coach-profile-request.model';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly BASE = '/api/users/me';

  /** Reactive avatar URL — updated by getMe() and uploadAvatar(). Header reads this. */
  readonly currentAvatarUrl = signal<string>(DEFAULT_AVATAR);

  /** Reactive username — updated by getMe(). Header reads this. */
  readonly currentUsername = signal<string>('');

  /**
   * Cached getMe() observable. shareReplay(1) means the first subscriber triggers
   * the HTTP call; subsequent subscribers receive the cached response immediately.
   * Cleared by invalidateCache() after any mutation so the next getMe() call is fresh.
   */
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

  invalidateCache(): void {
    this.meCache$ = null;
  }

  clearSession(): void {
    this.meCache$ = null;
    this.currentAvatarUrl.set(DEFAULT_AVATAR);
    this.currentUsername.set('');
  }

  updateProfile(dto: UpdateProfileRequest): Observable<void> {
    return this.api.put<void>(this.BASE, dto).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateMemberProfile(dto: UpdateMemberProfileRequest): Observable<void> {
    return this.api.put<void>(`${this.BASE}/member-profile`, dto).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateCoachProfile(dto: UpdateCoachProfileRequest): Observable<void> {
    return this.api.put<void>(`${this.BASE}/coach-profile`, dto).pipe(
      tap(() => this.invalidateCache())
    );
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.api.postForm<{ url: string }>(`${this.BASE}/avatar`, form).pipe(
      tap(res => {
        this.currentAvatarUrl.set(res.url);
        this.invalidateCache();
      })
    );
  }
}
