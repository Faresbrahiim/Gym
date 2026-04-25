import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { PagedResponse } from '../../../core/models/paged-response.model';
import { UserSearchResult } from '../models/user-search-result.model';
import { Conversation } from '../../chat/models/conversation.model';

@Injectable({ providedIn: 'root' })
export class PeopleService {

  constructor(private api: ApiService) {}

  search(q: string, page = 1, pageSize = 12): Observable<PagedResponse<UserSearchResult>> {
    return this.api.get<PagedResponse<UserSearchResult>>('/api/users/search', {
      params: { q, page, pageSize }
    });
  }

  getOrCreateConversation(senderId: string, receiverId: string): Observable<Conversation> {
    return this.api.post<Conversation>('/api/conversations', { senderId, receiverId });
  }
}
