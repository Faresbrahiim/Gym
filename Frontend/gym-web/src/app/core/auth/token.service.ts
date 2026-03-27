import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY  = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({ providedIn: 'root' })
export class TokenService {

  private decodedTokenCache: any | null = null;

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this.decodedTokenCache = null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.decodedTokenCache = null;
  }

  isTokenExpired(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded?.exp) return true;
    // exp is in seconds — compare against Date.now() which is milliseconds
    return Date.now() >= decoded.exp * 1000;
  }

  isAuthenticated(): boolean {
    if (!this.getAccessToken()) return false;
    return !this.isTokenExpired();
  }

  // ---------------------------------------------------
  // JWT decoding
  // ---------------------------------------------------

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      // JWT uses Base64url: replace url-safe chars, then pad to a multiple of 4
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  getDecodedToken(): any | null {
    if (this.decodedTokenCache) return this.decodedTokenCache;
    const token = this.getAccessToken();
    if (!token) return null;
    this.decodedTokenCache = this.decodeToken(token);
    return this.decodedTokenCache;
  }

  getUserId(): string | null {
    return this.getDecodedToken()?.sub ?? null;
  }

  getEmail(): string | null {
    return this.getDecodedToken()?.email ?? null;
  }

  getRole(): string | null {
    return this.getDecodedToken()?.role ?? null;
  }

  getPermissions(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded?.permission) return [];
    // .NET emits repeated claims — arrives as a single string or an array
    return Array.isArray(decoded.permission)
      ? decoded.permission
      : [decoded.permission];
  }
}
