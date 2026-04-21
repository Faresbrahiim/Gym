import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { TokenService } from '../../../core/auth/token.service';
import { environment } from '../../../../environments/environment';
import { Message } from '../models/message.model';

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
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('conversation:join', conversationId);
  }

  // senderId is intentionally omitted — the server derives it from the JWT
  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('message:send', { conversationId, content });
  }

  emitTypingStart(conversationId: string): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  emitTypingStop(conversationId: string): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  onMessage(): Observable<Message> {
    return new Observable(observer => {
      const handler = (message: Message) => observer.next(message);
      this.socket?.on('message:received', handler);
      return () => this.socket?.off('message:received', handler);
    });
  }

  onTypingStart(): Observable<{ userId: string }> {
    return new Observable(observer => {
      const handler = (data: { userId: string }) => observer.next(data);
      this.socket?.on('typing:start', handler);
      return () => this.socket?.off('typing:start', handler);
    });
  }

  onTypingStop(): Observable<{ userId: string }> {
    return new Observable(observer => {
      const handler = (data: { userId: string }) => observer.next(data);
      this.socket?.on('typing:stop', handler);
      return () => this.socket?.off('typing:stop', handler);
    });
  }

  onError(): Observable<{ message: string }> {
    return new Observable(observer => {
      const handler = (data: { message: string }) => observer.next(data);
      this.socket?.on('error', handler);
      return () => this.socket?.off('error', handler);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
