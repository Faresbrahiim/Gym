import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { SocketService } from '../../services/socket.service';
import { TokenService } from '../../../../core/auth/token.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  activeConversation = signal<Conversation | null>(null);
  onlineUsers = signal<string[]>([]);
  typingUsers = signal<string[]>([]);

  currentUserId = '';
  newMessage = '';
  newReceiverSearch = '';

  private subs = new Subscription();
  private typingTimeout: any;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private tokenService: TokenService,
    public currentUserService: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId() ?? '';
    this.socketService.connect();
    this.loadConversations();
    this.listenToSocket();
  }

  loadConversations(): void {
    this.subs.add(
      this.chatService.getUserConversations(this.currentUserId).subscribe(convs => {
        this.conversations.set(convs);
      })
    );
  }

  openConversation(conv: Conversation): void {
    this.activeConversation.set(conv);
    this.socketService.joinConversation(conv._id);
    this.messages.set([]);

    this.subs.add(
      this.chatService.getMessages(conv._id).subscribe(msgs => {
        this.messages.set(msgs);
        this.chatService.markAsRead(conv._id, this.currentUserId).subscribe();
      })
    );
  }

  startConversation(receiverId: string): void {
    if (!receiverId.trim()) return;
    this.subs.add(
      this.chatService.getOrCreateConversation(this.currentUserId, receiverId).subscribe(conv => {
        const exists = this.conversations().find(c => c._id === conv._id);
        if (!exists) {
          this.conversations.update(convs => [conv, ...convs]);
        }
        this.openConversation(conv);
        this.newReceiverSearch = '';
      })
    );
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    const conv = this.activeConversation();
    if (!content || !conv) return;

    this.socketService.sendMessage(conv._id, this.currentUserId, content);
    this.newMessage = '';
    this.socketService.emitTypingStop(conv._id, this.currentUserId);
  }

  onTyping(): void {
    const conv = this.activeConversation();
    if (!conv) return;

    this.socketService.emitTypingStart(conv._id, this.currentUserId);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socketService.emitTypingStop(conv._id, this.currentUserId);
    }, 1500);
  }

  listenToSocket(): void {
    this.subs.add(
      this.socketService.onMessage().subscribe(message => {
        const conv = this.activeConversation();
        if (conv && message.conversationId === conv._id) {
          this.messages.update(msgs => [...msgs, message]);
        }
        // update lastMessage in conversation list
        this.conversations.update(convs =>
          convs.map(c => c._id === message.conversationId
            ? { ...c, lastMessage: message }
            : c
          )
        );
      })
    );

    this.subs.add(
      this.socketService.onUsersOnline().subscribe(users => {
        this.onlineUsers.set(users);
      })
    );

    this.subs.add(
      this.socketService.onTypingStart().subscribe(({ userId }) => {
        if (userId !== this.currentUserId) {
          this.typingUsers.update(users =>
            users.includes(userId) ? users : [...users, userId]
          );
        }
      })
    );

    this.subs.add(
      this.socketService.onTypingStop().subscribe(({ userId }) => {
        this.typingUsers.update(users => users.filter(u => u !== userId));
      })
    );
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers().includes(userId);
  }

  getOtherParticipant(conv: Conversation): string {
    return conv.participants.find(p => p !== this.currentUserId) ?? '';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.socketService.disconnect();
  }
}
