import { SessionStatus } from './session-status.enum';

export interface SessionResponse {
  id: string;
  coachId: string;
  coachFullName: string;
  coachProfilePictureUrl: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  acceptedParticipants: number;
  remainingSeats: number;
  isFull: boolean;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}
