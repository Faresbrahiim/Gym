import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { UserMe } from '../models/user-me.model';
import { UpdateProfileRequest } from '../models/update-profile-request.model';
import { UpdateMemberProfileRequest } from '../models/update-member-profile-request.model';
import { UpdateCoachProfileRequest } from '../models/update-coach-profile-request.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly BASE = '/api/users/me';

  constructor(private api: ApiService) {}

  getMe(): Observable<UserMe> {
    return this.api.get<UserMe>(this.BASE);
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
    return this.api.postForm<{ url: string }>(`${this.BASE}/avatar`, form);
  }
}
