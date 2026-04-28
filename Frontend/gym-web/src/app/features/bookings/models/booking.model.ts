import { BookingStatus } from './booking-status.enum';

export interface MemberBookingResponse {
  id: string;
  sessionId: string;
  sessionTitle: string;
  coachFullName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CoachBookingResponse {
  id: string;
  sessionId: string;
  userId: string;
  userFullName: string;
  userProfilePictureUrl: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
