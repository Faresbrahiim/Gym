export interface AiCoachFeedbackRequest {
  userId: string;
  rating: number;
  comment?: string | null;
}
