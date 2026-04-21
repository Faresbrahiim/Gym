import { Injectable, OnDestroy, signal } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {

  readonly onlineMap = signal<Record<string, boolean>>({});

  private trackedIds: string[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private api: ApiService) {}

  // Start tracking a set of user IDs and polling their presence.
  // Calling again with a new list replaces the previous one.
  startTracking(userIds: string[]): void {
    this.trackedIds = [...userIds];

    this.fetchNow();

    if (!this.timer) {
      this.timer = setInterval(() => this.fetchNow(), POLL_INTERVAL_MS);
    }
  }

  stopTracking(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.trackedIds = [];
    this.onlineMap.set({});
  }

  isOnline(userId: string): boolean {
    return this.onlineMap()[userId] === true;
  }

  private fetchNow(): void {
    if (this.trackedIds.length === 0) return;

    this.api.post<Record<string, boolean>>('/api/presence/bulk', { userIds: this.trackedIds })
      .subscribe({
        next: map => this.onlineMap.set(map),
        error: () => { /* presence is best-effort — silently ignore failures */ }
      });
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }
}
