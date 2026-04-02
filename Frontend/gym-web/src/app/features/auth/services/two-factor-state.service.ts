import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TwoFactorStateService {

  private pendingUserId: string | null = null;
  private pendingReturnUrl: string | null = null;

  setPending(userId: string, returnUrl: string | null): void {
    this.pendingUserId  = userId;
    this.pendingReturnUrl = returnUrl;
  }

  getPendingUserId(): string | null {
    return this.pendingUserId;
  }

  getReturnUrl(): string | null {
    return this.pendingReturnUrl;
  }

  clear(): void {
    this.pendingUserId    = null;
    this.pendingReturnUrl = null;
  }
}
