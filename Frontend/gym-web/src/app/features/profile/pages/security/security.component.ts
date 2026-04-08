import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Session } from '../../models/session.model';

interface ParsedAgent {
  browser: string;
  os: string;
  isMobile: boolean;
}

function parseUserAgent(ua: string | null): ParsedAgent {
  if (!ua) return { browser: 'Unknown Browser', os: 'Unknown OS', isMobile: false };

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  let browser = 'Unknown Browser';
  if (/Firefox\//.test(ua))                        browser = 'Firefox';
  else if (/Edg\//.test(ua))                       browser = 'Edge';
  else if (/OPR\/|Opera\//.test(ua))               browser = 'Opera';
  else if (/Chrome\//.test(ua))                    browser = 'Chrome';
  else if (/Safari\//.test(ua))                    browser = 'Safari';

  let os = 'Unknown OS';
  if (/Windows/i.test(ua))                         os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua))           os = 'iOS';
  else if (/Android/i.test(ua))                    os = 'Android';
  else if (/Mac OS X/i.test(ua))                   os = 'macOS';
  else if (/Linux/i.test(ua))                      os = 'Linux';

  return { browser, os, isMobile };
}

@Component({
  standalone: true,
  selector: 'app-security',
  imports: [CommonModule, RouterLink],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css'
})
export class SecurityComponent implements OnInit {

  isLoading        = signal(true);
  hasError         = signal(false);
  loadErrorMessage = signal<string | null>(null);
  sessions       = signal<Session[]>([]);
  revokingIds    = signal<Set<string>>(new Set());
  isLoggingOutAll   = signal(false);
  showLogoutConfirm = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private errorService: ErrorService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  // -------------------------------------------------------
  // Data
  // -------------------------------------------------------

  private loadSessions(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.loadErrorMessage.set(null);

    this.sessionService.getSessions().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.sessions.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.loadErrorMessage.set(this.errorService.extractMessage(err));
      }
    });
  }

  retry(): void {
    this.loadSessions();
  }

  // -------------------------------------------------------
  // Current-session heuristic
  //
  // Primary: match sessions whose userAgent equals the
  // current browser's navigator.userAgent, then pick the
  // most recently created among those.
  //
  // Fallback (no UA match): fall back to the most recent
  // session overall — this covers proxies or UA changes.
  // -------------------------------------------------------

  private get currentSessionTokenId(): string | null {
    const all = this.sessions();
    if (all.length === 0) return null;

    const currentUA = navigator.userAgent;

    // All sessions from this browser
    const uaMatches = all.filter(s => s.userAgent === currentUA);

    if (uaMatches.length > 0) {
      // Newest among UA-matching sessions is the live one
      return uaMatches.reduce((a, b) =>
        new Date(b.createdAt) > new Date(a.createdAt) ? b : a
      ).tokenId;
    }

    // Fallback: no exact UA match (different machine, proxy, etc.)
    return all[0].tokenId; // already sorted newest-first
  }

  isCurrentSession(session: Session): boolean {
    return session.tokenId === this.currentSessionTokenId;
  }

  // -------------------------------------------------------
  // Revoke one session
  // -------------------------------------------------------

  isRevoking(tokenId: string): boolean {
    return this.revokingIds().has(tokenId);
  }

  revoke(tokenId: string): void {
    const ids = new Set(this.revokingIds());
    ids.add(tokenId);
    this.revokingIds.set(ids);

    this.sessionService.revokeSession(tokenId).subscribe({
      next: () => {
        this.sessions.set(this.sessions().filter(s => s.tokenId !== tokenId));
        const updated = new Set(this.revokingIds());
        updated.delete(tokenId);
        this.revokingIds.set(updated);
      },
      error: (err) => {
        const updated = new Set(this.revokingIds());
        updated.delete(tokenId);
        this.revokingIds.set(updated);
        this.toastService.error(this.errorService.extractMessage(err));
      }
    });
  }

  // -------------------------------------------------------
  // Logout all devices
  // -------------------------------------------------------

  promptLogoutAll(): void {
    this.showLogoutConfirm.set(true);
  }

  cancelLogoutAll(): void {
    this.showLogoutConfirm.set(false);
  }

  confirmLogoutAll(): void {
    this.showLogoutConfirm.set(false);
    this.isLoggingOutAll.set(true);

    // authService.logoutAll() internally clears tokens even on error.
    // We simply redirect to /login after the observable completes.
    this.authService.logoutAll().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  // -------------------------------------------------------
  // Display helpers
  // -------------------------------------------------------

  parseAgent(ua: string | null): ParsedAgent {
    return parseUserAgent(ua);
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
