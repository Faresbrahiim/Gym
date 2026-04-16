import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { SocketService } from '../../services/socket.service';
import { TokenService } from '../../../../core/auth/token.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  activeConversation = signal<Conversation | null>(null);

  users = signal<User[]>([]);
  onlineUsers = signal<string[]>([]);
  typingUsers = signal<string[]>([]);

  currentUserId = '';
  newMessage = '';

  private subs = new Subscription();
  private typingTimeout: any;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private socketService: SocketService,
    private tokenService: TokenService,
    public currentUserService: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId() ?? '';

    this.socketService.connect();

    this.loadInitialData();
    this.listenToSocket();
  }

  loadInitialData(): void {
    this.loadUsers();
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadUsers(): void {
    this.subs.add(
      this.userService.getUsers().subscribe(users => {
        this.users.set(users.filter(u => u.id !== this.currentUserId));
      })
    );
  }

  getUserById(id: string): User | undefined {
    return this.users().find(u => u.id === id);
  }

  loadConversations(): void {
    this.subs.add(
      this.chatService.getUserConversations(this.currentUserId)
        .subscribe(convs => this.conversations.set(convs))
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
        this.scrollToBottom();
      })
    );
  }

  startConversation(receiverId: string): void {
    this.subs.add(
      this.chatService.getOrCreateConversation(this.currentUserId, receiverId)
        .subscribe(conv => {

          const exists = this.conversations().some(c => c._id === conv._id);

          if (!exists) {
            this.conversations.update(c => [conv, ...c]);
          }

          this.openConversation(conv);
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
          this.scrollToBottom();
        }

        this.conversations.update(convs =>
          convs.map(c =>
            c._id === message.conversationId
              ? { ...c, lastMessage: message }
              : c
          )
        );
      })
    );

    this.subs.add(
      this.socketService.onUsersOnline()
        .subscribe(users => this.onlineUsers.set(users))
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

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.socketService.disconnect();
  }
}
