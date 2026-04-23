import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';

import { Message } from '../../models/message.model';
import { Contact } from '../../models/contact.model';

interface DayGroup {
  label: string;
  messages: Message[];
}

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.css']
})
export class MessageThreadComponent implements OnChanges, AfterViewChecked {

  @Input() messages:      Message[] = [];
  @Input() currentUserId  = '';
  @Input() contact:       Contact | null = null;
  @Input() isOnline       = false;
  @Input() typingUserIds: string[] = [];
  @Input() isLoading      = false;

  @Output() backClicked = new EventEmitter<void>();

  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLElement>;

  dayGroups: DayGroup[] = [];
  private shouldScroll  = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.dayGroups   = this.buildDayGroups(this.messages);
      this.shouldScroll = true;
    }
    if (changes['typingUserIds']) {
      this.shouldScroll = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  isMine(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  isRead(msg: Message): boolean {
    return msg.readBy.some(id => id !== this.currentUserId);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  get isTyping(): boolean {
    return this.typingUserIds.length > 0;
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  private buildDayGroups(messages: Message[]): DayGroup[] {
    const groups: DayGroup[] = [];
    let current: DayGroup | null = null;

    for (const msg of messages) {
      const label = this.dayLabel(msg.createdAt);
      if (!current || current.label !== label) {
        current = { label, messages: [] };
        groups.push(current);
      }
      current.messages.push(msg);
    }

    return groups;
  }

  private dayLabel(iso: string): string {
    const date  = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (this.sameDay(date, today))     return 'Today';
    if (this.sameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }
}
