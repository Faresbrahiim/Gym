import { Injectable } from '@angular/core';
import { Contact } from '../models/contact.model';
import { UserSearchResult } from '../../people/models/user-search-result.model';

@Injectable({ providedIn: 'root' })
export class ContactCacheService {

  private cache = new Map<string, Contact>();

  // Seed a single entry — called before navigating from the People page
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

  // Returns a resolved Contact, or a safe fallback if the userId is unknown.
  // The fallback is intentionally non-empty so the UI never shows a blank.
  resolve(userId: string): Contact {
    const cached = this.cache.get(userId);
    if (cached) return cached;

    // Backend gap: no batch-resolve endpoint yet.
    // Show a short anonymous placeholder until it's available.
    const fallback = this.buildFallback(userId);
    return fallback;
  }

  has(userId: string): boolean {
    return this.cache.has(userId);
  }

  private buildFallback(userId: string): Contact {
    // Use the last 6 chars of the UUID as a short anonymous label
    const short = userId.slice(-6).toUpperCase();
    return {
      userId,
      displayName: `User …${short}`,
      initials: '?',
    };
  }

  private toInitials(displayName: string): string {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
}
