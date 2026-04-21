import {
  Component,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ChatService }              from '../../services/chat.service';
import { SocketService }            from '../../services/socket.service';
import { PresenceService }          from '../../services/presence.service';
import { PresenceHeartbeatService } from '../../services/presence-heartbeat.service';
import { ContactCacheService }      from '../../services/contact-cache.service';
import { TokenService }             from '../../../../core/auth/token.service';

import { Conversation } from '../../models/conversation.model';
import { Message }      from '../../models/message.model';
import { Contact }      from '../../models/contact.model';

import { ConversationListComponent } from '../../components/conversation-list/conversation-list.component';
import { MessageThreadComponent }    from '../../components/message-thread/message-thread.component';
import { MessageInputComponent }     from '../../components/message-input/message-input.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    RouterLink,
    ConversationListComponent,
    MessageThreadComponent,
    MessageInputComponent
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  conversations        = signal<Conversation[]>([]);
  messages             = signal<Message[]>([]);
  activeConversation   = signal<Conversation | null>(null);
  typingUserIds        = signal<string[]>([]);
  loadingConversations = signal(true);
  loadingMessages      = signal(false);
  mobileShowThread     = signal(false);

  currentUserId = '';

  private deepLinkId: string | null = null;
  private subs = new Subscription();

  constructor(
    private chatService:       ChatService,
    private socketService:     SocketService,
    private presenceService:   PresenceService,
    private presenceHeartbeat: PresenceHeartbeatService,
    private contactCache:      ContactCacheService,
    private tokenService:      TokenService,
    private router:            Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId() ?? '';

    // Capture deep-link before anything async runs
    this.deepLinkId = (history.state as { openConversationId?: string })?.openConversationId ?? null;

    this.presenceHeartbeat.connect();
    this.socketService.connect();
    this.listenToSocket();
    this.loadConversations();
  }

  // ── Data loading ────────────────────────────────────────────────────────

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
              next: () => this.refreshConversationContacts(),
              error: () => this.handleDeepLink(convs),
              complete: () => {
                this.refreshConversationContacts();
                this.handleDeepLink(convs);
              }
            })
          );
        },
        error: () => this.loadingConversations.set(false)
      })
    );
  }

  openConversation(conv: Conversation): void {
    this.activeConversation.set(conv);
    this.typingUserIds.set([]);
    this.messages.set([]);
    this.loadingMessages.set(true);
    this.mobileShowThread.set(true);

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

  private markRead(conversationId: string): void {
    this.chatService.markAsRead(conversationId, this.currentUserId).subscribe();
  }

  // ── Socket events ────────────────────────────────────────────────────────

  private listenToSocket(): void {
    this.subs.add(
      this.socketService.onMessage().subscribe(msg => {
        const active = this.activeConversation();
        if (active && msg.conversationId === active._id) {
          this.messages.update(list => [...list, msg]);
          this.markRead(active._id);
        }

        // Update lastMessage in the sidebar regardless of which conv is open
        this.conversations.update(convs =>
          convs.map(c => c._id === msg.conversationId ? { ...c, lastMessage: msg } : c)
        );
      })
    );

    this.subs.add(
      this.socketService.onTypingStart().subscribe(({ userId }) => {
        if (userId !== this.currentUserId) {
          this.typingUserIds.update(ids =>
            ids.includes(userId) ? ids : [...ids, userId]
          );
        }
      })
    );

    this.subs.add(
      this.socketService.onTypingStop().subscribe(({ userId }) => {
        this.typingUserIds.update(ids => ids.filter(id => id !== userId));
      })
    );

    this.subs.add(
      this.socketService.onError().subscribe(({ message }) => {
        console.error('Socket error:', message);
      })
    );
  }

  // ── Input events from child components ───────────────────────────────────

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

  onBackClicked(): void {
    this.mobileShowThread.set(false);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getActiveContact(): Contact | null {
    const conv = this.activeConversation();
    if (!conv) return null;
    if (conv.isGroup) {
      return { userId: conv._id, displayName: conv.name ?? 'Group', initials: (conv.name ?? 'G').slice(0, 2).toUpperCase() };
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

  private collectOtherParticipantIds(convs: Conversation[]): string[] {
    const ids = new Set<string>();
    for (const c of convs) {
      for (const p of c.participants) {
        if (p !== this.currentUserId) ids.add(p);
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

  private handleDeepLink(convs: Conversation[]): void {
    if (!this.deepLinkId) return;
    const target = convs.find(c => c._id === this.deepLinkId);
    this.deepLinkId = null;
    if (target) this.openConversation(target);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.socketService.disconnect();
    this.presenceHeartbeat.disconnect();
    this.presenceService.stopTracking();
  }
}
