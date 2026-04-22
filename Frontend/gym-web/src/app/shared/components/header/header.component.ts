import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { AppNotification } from '../../../core/models/app-notification.model';
import { NotificationCenterService } from '../../../core/services/notification-center.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  private readonly authService       = inject(AuthService);
  private readonly tokenService      = inject(TokenService);
  private readonly currentUserService = inject(CurrentUserService);
  protected readonly notificationCenter = inject(NotificationCenterService);
  private readonly router            = inject(Router);
  private readonly subs              = new Subscription();

  isMobileMenuOpen = signal(false);
  isScrolled       = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 0);
  }

  /** Reactive avatar URL — hydrated by CurrentUserService at app boot. */
  readonly avatarUrl = this.currentUserService.currentAvatarUrl;

  ngOnInit(): void {
    if (!this.isAuthenticated) return;
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      this.notificationCenter.connectRealtime(accessToken);
    }
    this.subs.add(this.notificationCenter.load().subscribe());
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.notificationCenter.disconnectRealtime();
  }

  get username(): string {
    const fromProfile = this.currentUserService.currentUsername();
    if (fromProfile) return fromProfile;
    return this.tokenService.getEmail() ?? 'User';
  }

  get isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  get isHome(): boolean {
    const url = this.router.url;
    return url === '/home' || url === '/';
  }

  get headerClass(): string {
    return this.isHome ? 'header header-trans' : 'header header-sticky';
  }

  get logoSrc(): string {
    return this.isHome ? 'assets/img/logo.svg' : 'assets/img/logo-black.svg';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
    document.body.classList.toggle('menu-opened', this.isMobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    document.body.classList.remove('menu-opened');
  }

  onNotificationsToggle(): void {
    this.subs.add(this.notificationCenter.load().subscribe());
  }

  onMarkAllNotificationsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.subs.add(this.notificationCenter.markAllAsRead().subscribe());
  }

  onNotificationSelected(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const navigate = () => {
      if (notification.actionUrl) {
        this.router.navigateByUrl(notification.actionUrl);
      }
    };

    if (notification.status === 'UNREAD') {
      this.subs.add(
        this.notificationCenter.markAsRead(notification.id).subscribe({ next: navigate, error: navigate })
      );
      return;
    }

    navigate();
  }

  relativeNotificationTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
