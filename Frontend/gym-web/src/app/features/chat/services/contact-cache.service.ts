import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { Contact } from '../models/contact.model';
import { UserSearchResult } from '../../people/models/user-search-result.model';

interface ContactLookupDto {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContactCacheService {

  private cache = new Map<string, Contact>();

  constructor(private api: ApiService) {}

  // Seed a single entry - called before navigating from the People page
  seed(userId: string, displayName: string, avatarUrl?: string): void {
    this.cache.set(userId, {
      userId,
      displayName,
      initials: this.toInitials(displayName),
      avatarUrl
    });
  }

  // Convenience overload for a UserSearchResult object
  seedFromResult(result: UserSearchResult): void {
    const displayName = [result.firstName, result.lastName].filter(Boolean).join(' ') || result.username;
    this.seed(result.id, displayName, result.avatarUrl);
  }

  hydrate(userIds: string[]): Observable<void> {
    const missingIds = [...new Set(userIds.filter(userId => userId && !this.cache.has(userId)))];
    if (missingIds.length === 0) {
      return of(void 0);
    }

    return this.api.post<ContactLookupDto[]>('/api/users/contacts', { userIds: missingIds }).pipe(
      tap(results => {
        for (const result of results) {
          const displayName = result.displayName?.trim() || result.username;
          this.seed(result.id, displayName, result.avatarUrl ?? undefined);
        }
      }),
      map(() => void 0)
    );
  }

  // Returns a resolved Contact, or a safe fallback if the userId is unknown.
  // The fallback is intentionally non-empty so the UI never shows a blank.
  resolve(userId: string): Contact {
    const cached = this.cache.get(userId);
    if (cached) return cached;

    return this.buildFallback(userId);
  }

  has(userId: string): boolean {
    return this.cache.has(userId);
  }

  private buildFallback(userId: string): Contact {
    const short = userId.slice(-6).toUpperCase();
    return {
      userId,
      displayName: `User ...${short}`,
      initials: '?',
    };
  }

  private toInitials(displayName: string): string {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
}
