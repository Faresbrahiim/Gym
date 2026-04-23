import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/app-notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationRealtimeService {

  private client: Client | null = null;
  private connecting = false;
  private readonly incomingSubject = new Subject<AppNotification>();

  readonly incoming$ = this.incomingSubject.asObservable();

  constructor(private zone: NgZone) {}

  connect(accessToken: string): void {
    if (!accessToken || this.client?.active || this.connecting) return;
    this.connecting = true;
    void this.createClient(accessToken);
  }

  disconnect(): void {
    this.connecting = false;
    this.client?.deactivate();
    this.client = null;
  }

  private async createClient(accessToken: string): Promise<void> {
    try {
      const sockJsModule = await import('sockjs-client');
      const SockJS = (sockJsModule.default ?? sockJsModule) as new (url: string) => unknown;

      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.notificationWsUrl),
        reconnectDelay: 5000,
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`
        },
        debug: () => undefined,
        onConnect: () => {
          this.connecting = false;
          this.client?.subscribe('/user/queue/notifications', message => {
            this.handleMessage(message);
          });
        },
        onStompError: () => undefined,
        onWebSocketError: () => undefined,
        onWebSocketClose: () => {
          this.connecting = false;
        }
      });

      this.client.activate();
    } catch {
      this.connecting = false;
      this.client = null;
    }
  }

  private handleMessage(message: IMessage): void {
    try {
      const notification = JSON.parse(message.body) as AppNotification;
      this.zone.run(() => this.incomingSubject.next(notification));
    } catch {}
  }
}
