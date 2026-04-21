import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/token.service';

// Send a heartbeat at half the server TTL (default TTL = 60s → ping every 30s).
// The server refreshes the Redis TTL on every Ping or Text message received.
const HEARTBEAT_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS    =  5_000;

@Injectable({ providedIn: 'root' })
export class PresenceHeartbeatService implements OnDestroy {

  private ws:               WebSocket | null = null;
  private heartbeatTimer:   ReturnType<typeof setInterval>  | null = null;
  private reconnectTimer:   ReturnType<typeof setTimeout>   | null = null;
  private active            = false;

  constructor(private tokenService: TokenService) {}

  connect(): void {
    if (this.active) return;
    this.active = true;
    this.openSocket();
  }

  disconnect(): void {
    this.active = false;
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
  }

  private openSocket(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    const url = `${environment.presenceWsUrl}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.warn('PresenceHeartbeat: failed to create WebSocket', e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('PresenceHeartbeat: connected');
      this.startHeartbeat();
    };

    this.ws.onclose = (ev) => {
      console.log('PresenceHeartbeat: closed', ev.code, ev.reason);
      this.clearTimers();
      if (this.active) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onerror is always followed by onclose — reconnect handled there
    };
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    // Send an immediate ping to register online status right away
    this.ping();
    this.heartbeatTimer = setInterval(() => this.ping(), HEARTBEAT_INTERVAL_MS);
  }

  private ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send('ping');
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      if (this.active) this.openSocket();
    }, RECONNECT_DELAY_MS);
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    this.clearReconnect();
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
