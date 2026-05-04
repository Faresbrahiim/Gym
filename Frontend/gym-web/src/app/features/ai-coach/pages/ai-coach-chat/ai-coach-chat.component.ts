import { AfterViewChecked, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ErrorService } from '../../../../core/services/error.service';
import { TokenService } from '../../../../core/auth/token.service';
import { MembershipEntitlementsService } from '../../../membership/services/membership-entitlements.service';
import { AiCoachFeedbackRequest } from '../../models/ai-coach-feedback-request.model';
import { AiCoachHistoryEntry } from '../../models/ai-coach-history-entry.model';
import { AiCoachRecommendation } from '../../models/ai-coach-recommendation.model';
import { AiCoachService } from '../../services/ai-coach.service';

type MessageRole = 'user' | 'assistant';

interface AiCoachMessage {
  role: MessageRole;
  text: string;
  recommendationId?: string;
  intent?: string;
  createdAt?: string;
  feedbackRating?: number | null;
  feedbackPending?: boolean;
  feedbackError?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-ai-coach-chat',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-coach-chat.component.html',
  styleUrl: './ai-coach-chat.component.css'
})
export class AiCoachChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesArea') private messagesArea?: ElementRef<HTMLDivElement>;

  messages: AiCoachMessage[] = [];
  history: AiCoachHistoryEntry[] = [];
  userInput = '';
  isSending = false;
  isLoadingHistory = true;
  isLoadingEntitlements = true;
  sidebarOpen = true;
  activeHistoryId: string | null = null;
  historyError: string | null = null;
  missingUserId = false;
  aiCoachAllowed = true;
  aiCoachReason: string | null = null;

  private readonly aiCoachService = inject(AiCoachService);
  private readonly tokenService = inject(TokenService);
  private readonly errorService = inject(ErrorService);
  private readonly entitlementsService = inject(MembershipEntitlementsService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.sidebarOpen = typeof window === 'undefined' ? true : window.innerWidth >= 992;

    if (!this.currentUserId) {
      this.missingUserId = true;
      this.isLoadingHistory = false;
      this.isLoadingEntitlements = false;
      return;
    }

    this.loadEntitlements();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  get hasMessages(): boolean {
    return this.messages.length > 0;
  }

  get showLockedState(): boolean {
    return !this.isLoadingEntitlements && !this.aiCoachAllowed;
  }

  get currentUserId(): string | null {
    return this.tokenService.getUserId();
  }

  loadHistory(): void {
    const userId = this.currentUserId;
    if (!userId) return;

    this.isLoadingHistory = true;
    this.historyError = null;

    this.aiCoachService.getHistory(userId, 30).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: entries => {
        this.history = entries;
        this.isLoadingHistory = false;
      },
      error: err => {
        this.historyError = this.errorService.extractMessage(err);
        this.isLoadingHistory = false;
      }
    });
  }

  loadEntitlements(): void {
    this.isLoadingEntitlements = true;

    this.entitlementsService.load().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: entitlements => {
        this.aiCoachAllowed = !!entitlements.aiCoachAllowed;
        this.aiCoachReason = entitlements.aiCoachReason;
        this.isLoadingEntitlements = false;

        if (this.aiCoachAllowed) {
          this.loadHistory();
          return;
        }

        this.isLoadingHistory = false;
      },
      error: err => {
        this.aiCoachAllowed = false;
        this.aiCoachReason = this.errorService.extractMessage(err);
        this.isLoadingEntitlements = false;
        this.isLoadingHistory = false;
      }
    });
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.shiftKey) return;
    keyboardEvent.preventDefault();
    this.sendMessage();
  }

  quickSend(text: string): void {
    this.userInput = text;
    this.sendMessage();
  }

  sendMessage(): void {
    const question = this.userInput.trim();
    const userId = this.currentUserId;

    if (!question || this.isSending || !userId || !this.aiCoachAllowed) return;

    this.messages = [...this.messages, { role: 'user', text: question }];
    this.userInput = '';
    this.isSending = true;

    this.aiCoachService.recommend(userId, question).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: recommendation => {
        this.messages = [
          ...this.messages,
          mapRecommendationToAssistantMessage(recommendation)
        ];
        this.prependHistory(recommendation);
        this.activeHistoryId = recommendation.id;
        this.isSending = false;
      },
      error: err => {
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            text: this.errorService.extractMessage(err),
            feedbackError: null,
          }
        ];
        this.isSending = false;
      }
    });
  }

  newConversation(): void {
    this.messages = [];
    this.userInput = '';
    this.activeHistoryId = null;
  }

  loadConversation(entry: AiCoachHistoryEntry): void {
    this.activeHistoryId = entry.id;
    this.messages = [
      {
        role: 'user',
        text: entry.question,
        createdAt: entry.createdAt,
      },
      {
        role: 'assistant',
        text: entry.recommendation,
        recommendationId: entry.id,
        intent: entry.type,
        createdAt: entry.createdAt,
        feedbackError: null,
      }
    ];

    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      this.sidebarOpen = false;
    }
  }

  submitFeedback(message: AiCoachMessage, rating: number): void {
    const recommendationId = message.recommendationId;
    const userId = this.currentUserId;

    if (!recommendationId || !userId || message.feedbackPending) return;

    this.patchMessage(recommendationId, {
      feedbackPending: true,
      feedbackError: null,
    });

    const request: AiCoachFeedbackRequest = {
      userId,
      rating,
      comment: null,
    };

    this.aiCoachService.submitFeedback(recommendationId, request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: feedback => {
        this.patchMessage(recommendationId, {
          feedbackPending: false,
          feedbackRating: feedback.rating,
          feedbackError: null,
        });
      },
      error: err => {
        this.patchMessage(recommendationId, {
          feedbackPending: false,
          feedbackError: this.errorService.extractMessage(err),
        });
      }
    });
  }

  formatHistoryTitle(entry: AiCoachHistoryEntry): string {
    return entry.question.length > 38
      ? `${entry.question.slice(0, 38).trim()}...`
      : entry.question;
  }

  formatTimestamp(iso?: string): string {
    if (!iso) return '';

    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  prettyIntent(intent?: string): string {
    switch (intent) {
      case 'nutrition': return 'Nutrition';
      case 'coaching': return 'Training';
      case 'salle_info': return 'Gym Info';
      case 'greeting': return 'Greeting';
      case 'general': return 'General';
      default: return 'AI Coach';
    }
  }

  private prependHistory(recommendation: AiCoachRecommendation): void {
    const nextEntry: AiCoachHistoryEntry = {
      id: recommendation.id,
      userId: recommendation.userId,
      type: recommendation.intent,
      question: recommendation.question,
      recommendation: recommendation.recommendation,
      createdAt: recommendation.createdAt,
    };

    this.history = [
      nextEntry,
      ...this.history.filter(item => item.id !== nextEntry.id)
    ];
  }

  private patchMessage(recommendationId: string, patch: Partial<AiCoachMessage>): void {
    this.messages = this.messages.map(message =>
      message.recommendationId === recommendationId
        ? { ...message, ...patch }
        : message
    );
  }

  private scrollToBottom(): void {
    try {
      const target = this.messagesArea?.nativeElement;
      if (!target) return;
      target.scrollTop = target.scrollHeight;
    } catch {
      // Ignore scroll failures when the view is not ready yet.
    }
  }
}

function mapRecommendationToAssistantMessage(recommendation: AiCoachRecommendation): AiCoachMessage {
  return {
    role: 'assistant',
    text: recommendation.recommendation,
    recommendationId: recommendation.id,
    intent: recommendation.intent,
    createdAt: recommendation.createdAt,
    feedbackError: null,
  };
}
