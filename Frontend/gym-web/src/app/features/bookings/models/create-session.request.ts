export interface CreateSessionRequest {
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  maxParticipants: number;
}
