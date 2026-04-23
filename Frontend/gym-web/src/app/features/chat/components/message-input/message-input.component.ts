import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';

const TYPING_STOP_DELAY = 1500;

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.css']
})
export class MessageInputComponent implements OnDestroy {

  @Input() disabled = false;

  @Output() messageSent = new EventEmitter<string>();
  @Output() typingStart = new EventEmitter<void>();
  @Output() typingStop  = new EventEmitter<void>();

  @ViewChild('textarea') private textareaRef!: ElementRef<HTMLTextAreaElement>;

  content = '';
  private isTyping     = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  onInput(): void {
    this.autoGrow();
    this.handleTyping();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.content.trim();
    if (!text || this.disabled) return;

    this.messageSent.emit(text);
    this.content = '';
    this.resetHeight();
    this.clearTypingTimer();

    if (this.isTyping) {
      this.typingStop.emit();
      this.isTyping = false;
    }
  }

  private handleTyping(): void {
    if (!this.isTyping) {
      this.typingStart.emit();
      this.isTyping = true;
    }

    this.clearTypingTimer();
    this.typingTimer = setTimeout(() => {
      this.typingStop.emit();
      this.isTyping = false;
    }, TYPING_STOP_DELAY);
  }

  private autoGrow(): void {
    const el = this.textareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  private resetHeight(): void {
    const el = this.textareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
  }

  private clearTypingTimer(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTypingTimer();
  }
}
