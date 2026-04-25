import { Injectable, signal } from '@angular/core';
import { Observable, Subscription, forkJoin, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AppNotification, NotificationUnreadCountResponse } from '../models/app-notification.model';
import { NotificationRealtimeService } from './notification-realtime.service';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  private readonly activeConversationId = signal<string | null>(null);
  private realtimeSub: Subscription | null = null;

  constructor(
    private api: ApiService,
    private realtime: NotificationRealtimeService
  ) {}

  load(): Observable<[AppNotification[], NotificationUnreadCountResponse]> {
    this.loading.set(true);

    return forkJoin([
      this.api.get<AppNotification[]>('/api/notifications/me'),
      this.api.get<NotificationUnreadCountResponse>('/api/notifications/me/unread-count')
    ]).pipe(
      tap({
        next: ([notifications, unread]) => {
          this.notifications.set(notifications);
          this.unreadCount.set(unread.count);
        },
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false)
      })
    );
  }

  refreshCount(): Observable<NotificationUnreadCountResponse> {
    return this.api.get<NotificationUnreadCountResponse>('/api/notifications/me/unread-count').pipe(
      tap(({ count }) => this.unreadCount.set(count))
    );
  }

  markAsRead(notificationId: string): Observable<AppNotification> {
    return this.api.post<AppNotification>(`/api/notifications/${notificationId}/read`, {}).pipe(
      tap(notification => {
        this.notifications.update(items =>
          items.map(item => item.id === notification.id ? notification : item)
        );
        this.syncUnreadCount();
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.api.post<void>('/api/notifications/me/read-all', {}).pipe(
      tap(() => {
        const now = new Date().toISOString();
        this.notifications.update(items =>
          items.map(item => item.status === 'UNREAD' ? { ...item, status: 'READ', readAt: now } : item)
        );
        this.unreadCount.set(0);
      })
    );
  }

  markConversationAsRead(conversationId: string): Observable<void> {
    return this.api.post<void>('/api/notifications/me/read-resource', {
      resourceType: 'CONVERSATION',
      resourceId: conversationId
    }).pipe(
      tap(() => {
        const now = new Date().toISOString();
        this.notifications.update(items =>
          items.map(item =>
            item.resourceType === 'CONVERSATION' &&
            item.resourceId === conversationId &&
            item.status === 'UNREAD'
              ? { ...item, status: 'READ', readAt: now }
              : item
          )
        );
        this.syncUnreadCount();
      })
    );
  }

  connectRealtime(accessToken: string): void {
    if (!accessToken || this.realtimeSub) return;

    this.realtime.connect(accessToken);
    this.realtimeSub = this.realtime.incoming$.subscribe(notification => {
      if (this.shouldSuppressRealtime(notification)) {
        const conversationId = notification.resourceId;
        if (conversationId) {
          this.markConversationAsRead(conversationId).subscribe({ error: () => undefined });
        }
        return;
      }

      this.upsert(notification);
      this.syncUnreadCount();
      this.refreshCount().subscribe({ error: () => undefined });
    });
  }

  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId.set(conversationId);
  }

  disconnectRealtime(): void {
    this.realtimeSub?.unsubscribe();
    this.realtimeSub = null;
    this.realtime.disconnect();
  }

  private syncUnreadCount(): void {
    this.unreadCount.set(this.notifications().filter(item => item.status === 'UNREAD').length);
  }

  private upsert(notification: AppNotification): void {
    this.notifications.update(items => {
      const existingIndex = items.findIndex(item => item.id === notification.id);
      if (existingIndex === -1) {
        return [notification, ...items];
      }

      const next = [...items];
      next[existingIndex] = notification;
      return next;
    });
  }

  private shouldSuppressRealtime(notification: AppNotification): boolean {
    if (notification.type !== 'CHAT_MESSAGE_RECEIVED') return false;
    if (notification.resourceType !== 'CONVERSATION') return false;
    if (!notification.resourceId) return false;
    if (notification.resourceId !== this.activeConversationId()) return false;

    return this.isDocumentVisible();
  }

  private isDocumentVisible(): boolean {
    if (typeof document === 'undefined') {
      return true;
    }

    return document.visibilityState === 'visible';
  }
}
