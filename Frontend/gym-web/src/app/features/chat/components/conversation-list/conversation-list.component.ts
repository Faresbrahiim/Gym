import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  signal,
  computed
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { Conversation } from '../../models/conversation.model';
import { ContactCacheService } from '../../services/contact-cache.service';
import { PresenceService } from '../../services/presence.service';
import { Contact } from '../../models/contact.model';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.css']
})
export class ConversationListComponent implements OnChanges {

  @Input() conversations: Conversation[] = [];
  @Input() activeConversationId: string | null = null;
  @Input() currentUserId = '';

  @Output() conversationSelected = new EventEmitter<Conversation>();

  filterControl = new FormControl('');
  filterValue = signal('');

  constructor(
    public contactCache: ContactCacheService,
    public presence: PresenceService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversations']) {
      this.filterControl.valueChanges.subscribe(v => this.filterValue.set((v ?? '').toLowerCase()));
    }
  }

  get filtered(): Conversation[] {
    const q = this.filterValue().trim();
    if (!q) return this.conversations;
    return this.conversations.filter(c => {
      const contact = this.contactCache.resolve(this.otherParticipant(c));
      return contact.displayName.toLowerCase().includes(q);
    });
  }

  otherParticipant(conv: Conversation): string {
    return conv.participants.find(p => p !== this.currentUserId) ?? conv.participants[0] ?? '';
  }

  getContact(conv: Conversation): Contact {
    if (conv.isGroup) {
      return {
        userId: conv._id,
        displayName: conv.name ?? 'Group',
        initials: (conv.name ?? 'G').slice(0, 2).toUpperCase()
      };
    }
    return this.contactCache.resolve(this.otherParticipant(conv));
  }

  isOnline(conv: Conversation): boolean {
    if (conv.isGroup) return false;
    return this.presence.isOnline(this.otherParticipant(conv));
  }

  isUnread(conv: Conversation): boolean {
    const last = conv.lastMessage;
    if (!last) return false;
    return last.senderId !== this.currentUserId && !last.readBy.includes(this.currentUserId);
  }

  lastMessagePreview(conv: Conversation): string {
    const last = conv.lastMessage;
    if (!last) return 'No messages yet';
    const prefix = last.senderId === this.currentUserId ? 'You: ' : '';
    const text = last.content.length > 42 ? last.content.slice(0, 42) + '…' : last.content;
    return prefix + text;
  }

  relativeTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);

    if (mins  <  1) return 'now';
    if (mins  < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days  <  7) return `${days}d`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  select(conv: Conversation): void {
    this.conversationSelected.emit(conv);
  }

  clearFilter(): void {
    this.filterControl.setValue('');
  }
}
