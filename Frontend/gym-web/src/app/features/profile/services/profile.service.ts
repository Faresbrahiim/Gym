import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { UserMe } from '../models/user-me.model';
import { UpdateProfileRequest } from '../models/update-profile-request.model';
import { UpdateMemberProfileRequest } from '../models/update-member-profile-request.model';
import { UpdateCoachProfileRequest } from '../models/update-coach-profile-request.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly BASE = '/api/users/me';

  private readonly currentUser = inject(CurrentUserService);
  private readonly api         = inject(ApiService);

  /** Expose signals so existing page components keep working without changes. */
  readonly currentAvatarUrl = this.currentUser.currentAvatarUrl;
  readonly currentUsername   = this.currentUser.currentUsername;

  getMe(): Observable<UserMe> {
    return this.currentUser.getMe();
  }

  invalidateCache(): void {
    this.currentUser.invalidateCache();
  }

  clearSession(): void {
    this.currentUser.clearSession();
  }

  updateProfile(dto: UpdateProfileRequest): Observable<void> {
    return this.api.put<void>(this.BASE, dto).pipe(
      tap(() => {
        this.currentUser.invalidateCache();
        this.currentUser.hydrate();
      })
    );
  }

  updateMemberProfile(dto: UpdateMemberProfileRequest): Observable<void> {
    return this.api.put<void>(`${this.BASE}/member-profile`, dto).pipe(
      tap(() => {
        this.currentUser.invalidateCache();
        this.currentUser.hydrate();
      })
    );
  }

  updateCoachProfile(dto: UpdateCoachProfileRequest): Observable<void> {
    return this.api.put<void>(`${this.BASE}/coach-profile`, dto).pipe(
      tap(() => {
        this.currentUser.invalidateCache();
        this.currentUser.hydrate();
      })
    );
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.api.postForm<{ url: string }>(`${this.BASE}/avatar`, form).pipe(
      tap(res => {
        // Immediately update the avatar signal for instant header feedback,
        // then invalidate so the next getMe() returns the persisted URL.
        this.currentUser.currentAvatarUrl.set(res.url);
        this.currentUser.invalidateCache();
        this.currentUser.hydrate();
      })
    );
  }
}
