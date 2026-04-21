import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TokenService } from '../../../../core/auth/token.service';
import { ChatService } from '../../services/chat.service';
import { ChatPopupService } from '../../services/chat-popup.service';
import { ContactCacheService } from '../../services/contact-cache.service';
import { PresenceHeartbeatService } from '../../services/presence-heartbeat.service';
import { PresenceService } from '../../services/presence.service';
import { SocketService } from '../../services/socket.service';

import { Contact } from '../../models/contact.model';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';

import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageThreadComponent } from '../message-thread/message-thread.component';

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [
    ConversationListComponent,
    MessageInputComponent,
    MessageThreadComponent
  ],
  templateUrl: './chat-popup.component.html',
  styleUrls: ['./chat-popup.component.css']
})
export class ChatPopupComponent implements OnInit, OnDestroy {

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  activeConversation = signal<Conversation | null>(null);
  typingUserIds = signal<string[]>([]);
  loadingConversations = signal(false);
  loadingMessages = signal(false);

  currentUserId = '';

  private readonly subs = new Subscription();

  constructor(
    public popup: ChatPopupService,
    private chatService: ChatService,
    private socketService: SocketService,
    private presenceService: PresenceService,
    private presenceHeartbeat: PresenceHeartbeatService,
    private contactCache: ContactCacheService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  get isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  ngOnInit(): void {
    if (!this.isAuthenticated) return;

    this.currentUserId = this.tokenService.getUserId() ?? '';

    this.presenceHeartbeat.connect();
    this.socketService.connect();
    this.listenToSocket();
    this.loadConversations();
  }

  openPopup(): void {
    this.popup.open();
  }

  minimize(): void {
    this.popup.close();
  }

  openFullChat(): void {
    this.popup.close();
    this.router.navigate(['/chat']);
  }

  openConversation(conv: Conversation): void {
    this.activeConversation.set(conv);
    this.typingUserIds.set([]);
    this.messages.set([]);
    this.loadingMessages.set(true);

    this.socketService.joinConversation(conv._id);

    this.subs.add(
      this.chatService.getMessages(conv._id).subscribe({
        next: msgs => {
          this.messages.set(msgs);
          this.loadingMessages.set(false);
          this.markRead(conv._id);
        },
        error: () => this.loadingMessages.set(false)
      })
    );
  }

  closeThread(): void {
    this.activeConversation.set(null);
    this.typingUserIds.set([]);
    this.messages.set([]);
  }

  onMessageSent(content: string): void {
    const conv = this.activeConversation();
    if (!conv) return;
    this.socketService.sendMessage(conv._id, content);
  }

  onTypingStart(): void {
    const conv = this.activeConversation();
    if (conv) this.socketService.emitTypingStart(conv._id);
  }

  onTypingStop(): void {
    const conv = this.activeConversation();
    if (conv) this.socketService.emitTypingStop(conv._id);
  }

  getActiveContact(): Contact | null {
    const conv = this.activeConversation();
    if (!conv) return null;
    if (conv.isGroup) {
      return {
        userId: conv._id,
        displayName: conv.name ?? 'Group',
        initials: (conv.name ?? 'G').slice(0, 2).toUpperCase()
      };
    }

    const otherId = conv.participants.find(p => p !== this.currentUserId) ?? '';
    return this.contactCache.resolve(otherId);
  }

  isActiveContactOnline(): boolean {
    const conv = this.activeConversation();
    if (!conv || conv.isGroup) return false;

    const otherId = conv.participants.find(p => p !== this.currentUserId) ?? '';
    return this.presenceService.isOnline(otherId);
  }

  private loadConversations(): void {
    this.loadingConversations.set(true);

    this.subs.add(
      this.chatService.getUserConversations(this.currentUserId).subscribe({
        next: convs => {
          this.conversations.set(convs);
          this.loadingConversations.set(false);

          const participantIds = this.collectOtherParticipantIds(convs);
          this.trackParticipants(participantIds);

          this.subs.add(
            this.contactCache.hydrate(participantIds).subscribe({
              next: () => this.refreshConversationContacts()
            })
          );
        },
        error: () => this.loadingConversations.set(false)
      })
    );
  }

  private listenToSocket(): void {
    this.subs.add(
      this.socketService.onMessage().subscribe(msg => {
        const active = this.activeConversation();
        if (active && msg.conversationId === active._id) {
          this.messages.update(list => [...list, msg]);
          this.markRead(active._id);
        }

        this.conversations.update(convs =>
          convs.map(c => c._id === msg.conversationId ? { ...c, lastMessage: msg } : c)
        );
      })
    );

    this.subs.add(
      this.socketService.onTypingStart().subscribe(({ userId }) => {
        if (userId !== this.currentUserId) {
          this.typingUserIds.update(ids => ids.includes(userId) ? ids : [...ids, userId]);
        }
      })
    );

    this.subs.add(
      this.socketService.onTypingStop().subscribe(({ userId }) => {
        this.typingUserIds.update(ids => ids.filter(id => id !== userId));
      })
    );
  }

  private markRead(conversationId: string): void {
    this.chatService.markAsRead(conversationId, this.currentUserId).subscribe();
  }

  private collectOtherParticipantIds(convs: Conversation[]): string[] {
    const ids = new Set<string>();
    for (const conv of convs) {
      for (const participant of conv.participants) {
        if (participant !== this.currentUserId) ids.add(participant);
      }
    }
    return [...ids];
  }

  private trackParticipants(userIds: string[]): void {
    if (userIds.length > 0) {
      this.presenceService.startTracking(userIds);
    }
  }

  private refreshConversationContacts(): void {
    this.conversations.update(convs => [...convs]);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.socketService.disconnect();
    this.presenceHeartbeat.disconnect();
    this.presenceService.stopTracking();
  }
}
