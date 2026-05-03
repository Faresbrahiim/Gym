import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { AiCoachFeedback } from '../models/ai-coach-feedback.model';
import { AiCoachFeedbackRequest } from '../models/ai-coach-feedback-request.model';
import { AiCoachHistoryEntry } from '../models/ai-coach-history-entry.model';
import { AiCoachRecommendation } from '../models/ai-coach-recommendation.model';

interface RecommendApiResponse {
  id: string;
  user_id: string;
  question: string;
  intent: string;
  recommendation: string;
  created_at: string;
}

interface HistoryApiItem {
  id: string;
  user_id: string;
  type: string;
  question: string;
  recommendation: string;
  created_at: string;
}

interface HistoryApiResponse {
  history: HistoryApiItem[];
}

interface FeedbackApiResponse {
  id: string;
  recommendation_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AiCoachService {
  private readonly BASE = '/api/ai';
  private readonly api = inject(ApiService);

  recommend(userId: string, question: string): Observable<AiCoachRecommendation> {
    return this.api.post<RecommendApiResponse>(`${this.BASE}/recommend`, {
      user_id: userId,
      question,
    }).pipe(map(mapRecommendation));
  }

  getHistory(userId: string, limit = 20): Observable<AiCoachHistoryEntry[]> {
    return this.api.get<HistoryApiResponse>(`${this.BASE}/history`, {
      params: {
        user_id: userId,
        limit,
      }
    }).pipe(map(response => response.history.map(mapHistoryEntry)));
  }

  submitFeedback(
    recommendationId: string,
    request: AiCoachFeedbackRequest,
  ): Observable<AiCoachFeedback> {
    return this.api.put<FeedbackApiResponse>(
      `${this.BASE}/recommendations/${recommendationId}/feedback`,
      {
        user_id: request.userId,
        rating: request.rating,
        comment: request.comment ?? null,
      }
    ).pipe(map(mapFeedback));
  }
}

function mapRecommendation(response: RecommendApiResponse): AiCoachRecommendation {
  return {
    id: response.id,
    userId: response.user_id,
    question: response.question,
    intent: response.intent,
    recommendation: response.recommendation,
    createdAt: response.created_at,
  };
}

function mapHistoryEntry(item: HistoryApiItem): AiCoachHistoryEntry {
  return {
    id: item.id,
    userId: item.user_id,
    type: item.type,
    question: item.question,
    recommendation: item.recommendation,
    createdAt: item.created_at,
  };
}

function mapFeedback(response: FeedbackApiResponse): AiCoachFeedback {
  return {
    id: response.id,
    recommendationId: response.recommendation_id,
    rating: response.rating,
    comment: response.comment,
    createdAt: response.created_at,
  };
}
