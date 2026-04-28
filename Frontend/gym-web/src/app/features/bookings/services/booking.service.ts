import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { BookingPagedResponse } from '../models/booking-paged-response.model';
import { SessionResponse } from '../models/session.model';
import { BookingEligibilityResponse } from '../models/booking-eligibility.model';
import { MemberBookingResponse, CoachBookingResponse } from '../models/booking.model';
import { CreateSessionRequest } from '../models/create-session.request';

@Injectable({ providedIn: 'root' })
export class BookingService {

  constructor(private apiService: ApiService) {}

  // ── Member ─────────────────────────────────────────────────────────────────

  getSessions(page = 1, pageSize = 12): Observable<BookingPagedResponse<SessionResponse>> {
    return this.apiService.get<BookingPagedResponse<SessionResponse>>('/api/sessions', {
      params: { page, pageSize }
    });
  }

  getBookingEligibility(): Observable<BookingEligibilityResponse> {
    return this.apiService.get<BookingEligibilityResponse>('/api/sessions/booking-eligibility');
  }

  bookSession(sessionId: string): Observable<MemberBookingResponse> {
    return this.apiService.post<MemberBookingResponse>(`/api/sessions/${sessionId}/book`, {});
  }

  getMyBookings(page = 1, pageSize = 10): Observable<BookingPagedResponse<MemberBookingResponse>> {
    return this.apiService.get<BookingPagedResponse<MemberBookingResponse>>('/api/me/bookings', {
      params: { page, pageSize }
    });
  }

  // ── Coach ──────────────────────────────────────────────────────────────────

  createSession(request: CreateSessionRequest): Observable<SessionResponse> {
    return this.apiService.post<SessionResponse>('/api/coach/sessions', request);
  }

  getCoachSessions(page = 1, pageSize = 10): Observable<BookingPagedResponse<SessionResponse>> {
    return this.apiService.get<BookingPagedResponse<SessionResponse>>('/api/coach/sessions', {
      params: { page, pageSize }
    });
  }

  getSessionBookings(sessionId: string, page = 1, pageSize = 10): Observable<BookingPagedResponse<CoachBookingResponse>> {
    return this.apiService.get<BookingPagedResponse<CoachBookingResponse>>(
      `/api/coach/sessions/${sessionId}/bookings`,
      { params: { page, pageSize } }
    );
  }

  acceptBooking(bookingId: string): Observable<CoachBookingResponse> {
    return this.apiService.put<CoachBookingResponse>(`/api/coach/bookings/${bookingId}/accept`, {});
  }

  declineBooking(bookingId: string): Observable<CoachBookingResponse> {
    return this.apiService.put<CoachBookingResponse>(`/api/coach/bookings/${bookingId}/decline`, {});
  }
}
