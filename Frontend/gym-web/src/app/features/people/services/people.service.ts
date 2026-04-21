import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { UserSearchResult } from '../models/user-search-result.model';
import { Conversation } from '../../chat/models/conversation.model';

@Injectable({ providedIn: 'root' })
export class PeopleService {

  constructor(private api: ApiService) {}

  search(q: string): Observable<UserSearchResult[]> {
    return this.api.get<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
  }

  getOrCreateConversation(senderId: string, receiverId: string): Observable<Conversation> {
    return this.api.post<Conversation>('/api/conversations', { senderId, receiverId });
  }
}
