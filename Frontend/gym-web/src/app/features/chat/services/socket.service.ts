import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { TokenService } from '../../../core/auth/token.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket: Socket | null = null;

  constructor(private tokenService: TokenService) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token: this.tokenService.getAccessToken() }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      const userId = this.tokenService.getUserId();
      if (userId) this.socket?.emit('user:online', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('conversation:join', conversationId);
  }

  sendMessage(conversationId: string, senderId: string, content: string): void {
    this.socket?.emit('message:send', { conversationId, senderId, content });
  }

  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('message:received', (message) => {
        observer.next(message);
      });
    });
  }

  onUsersOnline(): Observable<string[]> {
    return new Observable(observer => {
      this.socket?.on('users:online', (users: string[]) => {
        observer.next(users);
      });
    });
  }

  emitTypingStart(conversationId: string, userId: string): void {
    this.socket?.emit('typing:start', { conversationId, userId });
  }

  emitTypingStop(conversationId: string, userId: string): void {
    this.socket?.emit('typing:stop', { conversationId, userId });
  }

  onTypingStart(): Observable<{ userId: string }> {
    return new Observable(observer => {
      this.socket?.on('typing:start', (data) => observer.next(data));
    });
  }

  onTypingStop(): Observable<{ userId: string }> {
    return new Observable(observer => {
      this.socket?.on('typing:stop', (data) => observer.next(data));
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
