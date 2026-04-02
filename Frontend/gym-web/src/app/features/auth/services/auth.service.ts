import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { TokenService } from '../../../core/auth/token.service';
import { LoginRequest } from '../../../shared/models/auth/login-request.model';
import { LoginResponse } from '../../../shared/models/auth/login-response.model';
import { RegisterRequest } from '../../../shared/models/auth/register-request.model';
import { VerifyTwoFactorRequest } from '../../../shared/models/auth/verify-two-factor-request.model';
import { TwoFactorSetupResponse } from '../../../shared/models/auth/two-factor-setup-response.model';
import { TwoFactorConfirmResponse } from '../../../shared/models/auth/two-factor-confirm-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly AUTH_BASE = '/api/auth';

  constructor(private api: ApiService, private tokenService: TokenService) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.AUTH_BASE}/login/email`, credentials);
  }

  register(request: RegisterRequest): Observable<unknown> {
    return this.api.post<unknown>(`${this.AUTH_BASE}/register`, request);
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`${this.AUTH_BASE}/verify-email`, { token });
  }

  verifyTwoFactor(request: VerifyTwoFactorRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.AUTH_BASE}/2fa/verify`, request);
  }

  setupTwoFactor(): Observable<TwoFactorSetupResponse> {
    return this.api.post<TwoFactorSetupResponse>(`${this.AUTH_BASE}/2fa/setup`, {});
  }

  confirmTwoFactor(code: string): Observable<TwoFactorConfirmResponse> {
    return this.api.post<TwoFactorConfirmResponse>(`${this.AUTH_BASE}/2fa/confirm`, { code });
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.tokenService.clearTokens();
      return of<void>(undefined);
    }

    return this.api.post<void>(`${this.AUTH_BASE}/logout`, { refreshToken }).pipe(
      tap(() => this.tokenService.clearTokens()),
      catchError(() => {
        this.tokenService.clearTokens();
        return of<void>(undefined);
      })
    );
  }
}
