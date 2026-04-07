import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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

  constructor(private api: ApiService) {}

  getMe(): Observable<UserMe> {
    return this.api.get<UserMe>(this.BASE).pipe(
      tap(me => {
        if (me.profile?.profilePictureUrl) {
          this.currentAvatarUrl.set(me.profile.profilePictureUrl);
        }
        if (me.username) {
          this.currentUsername.set(me.username);
        }
      })
    );
  }

  updateProfile(dto: UpdateProfileRequest): Observable<void> {
    return this.api.put<void>(this.BASE, dto);
  }

  updateMemberProfile(dto: UpdateMemberProfileRequest): Observable<void> {
    return this.api.put<void>(`${this.BASE}/member-profile`, dto);
  }

  updateCoachProfile(dto: UpdateCoachProfileRequest): Observable<void> {
    return this.api.put<void>(`${this.BASE}/coach-profile`, dto);
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.api.postForm<{ url: string }>(`${this.BASE}/avatar`, form).pipe(
      tap(res => this.currentAvatarUrl.set(res.url))
    );
  }
}
