import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpContext,
  HttpContextToken
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TokenService } from '../auth/token.service';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../shared/models/auth/login-response.model';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators';

// Marks a request as a retry — prevents the interceptor from retrying again
const IS_RETRY = new HttpContextToken<boolean>(() => false);

// Shared in-flight refresh observable — ensures concurrent 401s share one refresh call
let refreshInProgress$: Observable<LoginResponse> | null = null;

const REFRESH_URL = `${environment.apiUrl}/api/auth/refresh`;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  // Skip non-API requests
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  const tokenService = inject(TokenService);
  const router       = inject(Router);
  const http         = inject(HttpClient);

  // Attach Bearer token if present
  const token = tokenService.getAccessToken();
  const authRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authRequest).pipe(
    catchError((error) => {
      // Only handle 401s — pass everything else through
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Do not retry pre-auth or refresh requests — avoids infinite loops
      if (
        request.url.includes('/api/auth/login') ||
        request.url.includes('/api/auth/refresh') ||
        request.url.includes('/api/auth/2fa/verify')
      ) {
        return throwError(() => error);
      }

      // Do not retry a request that has already been retried
      if (request.context.get(IS_RETRY)) {
        tokenService.clearTokens();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        tokenService.clearTokens();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // Start refresh only once — concurrent 401s share the same observable
      if (!refreshInProgress$) {
        refreshInProgress$ = http
          .post<LoginResponse>(REFRESH_URL, { refreshToken })
          .pipe(shareReplay(1));
      }

      return refreshInProgress$.pipe(
        switchMap((response) => {
          refreshInProgress$ = null; 

          if (!response.accessToken || !response.refreshToken) {
            tokenService.clearTokens();
            router.navigate(['/login']);
            return throwError(() => new Error('Refresh returned no tokens'));
          }

          tokenService.setTokens(response.accessToken, response.refreshToken);

          // Retry the original request with the new token, flagged as a retry
          const retried = request.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` },
            context: new HttpContext().set(IS_RETRY, true)
          });

          return next(retried);
        }),
        catchError((refreshError) => {
          refreshInProgress$ = null;
          tokenService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
