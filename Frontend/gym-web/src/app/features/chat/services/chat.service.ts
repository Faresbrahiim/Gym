import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class ChatService {

  constructor(private api: ApiService) {}

  getOrCreateConversation(senderId: string, receiverId: string): Observable<Conversation> {
    return this.api.post<Conversation>('/api/conversations', { senderId, receiverId });
  }

  getUserConversations(userId: string): Observable<Conversation[]> {
    return this.api.get<Conversation[]>(`/api/conversations/${userId}`);
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.api.get<Message[]>(`/api/messages/${conversationId}`);
  }

  sendMessage(conversationId: string, senderId: string, content: string): Observable<Message> {
    return this.api.post<Message>('/api/messages', { conversationId, senderId, content });
  }

  markAsRead(conversationId: string, userId: string): Observable<any> {
    return this.api.patch<any>(`/api/messages/${conversationId}/read`, { userId });
  }

  createGroup(name: string, participants: string[], adminId: string): Observable<Conversation> {
    return this.api.post<Conversation>('/api/conversations/group', { name, participants, adminId });
  }
}
