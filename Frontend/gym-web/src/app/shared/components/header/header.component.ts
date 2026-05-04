import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, of, Subscription, switchMap, tap, catchError, timer } from 'rxjs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { AppNotification } from '../../../core/models/app-notification.model';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { PeopleService } from '../../../features/people/services/people.service';
import { UserSearchResult } from '../../../features/people/models/user-search-result.model';
import { CartService } from '../../../features/cart/services/cart.service';

const NOTIFICATION_COUNT_REFRESH_MS = 5000;

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  private readonly authService       = inject(AuthService);
  private readonly tokenService      = inject(TokenService);
  private readonly currentUserService = inject(CurrentUserService);
  protected readonly notificationCenter = inject(NotificationCenterService);
  private readonly router            = inject(Router);
  private readonly peopleService     = inject(PeopleService);
  private readonly cartService       = inject(CartService);
  private readonly elementRef        = inject(ElementRef<HTMLElement>);
  private readonly subs              = new Subscription();

  readonly cartItemCount = this.cartService.cart$;

  isMobileMenuOpen = signal(false);
  isScrolled       = signal(false);
  peopleSearchControl = new FormControl('', { nonNullable: true });
  peopleSearchResults = signal<UserSearchResult[]>([]);
  peopleSearchLoading = signal(false);
  peopleSearchOpen = signal(false);
  peopleSearchError = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.peopleSearchOpen.set(false);
    }
  }

  /** Reactive avatar URL — hydrated by CurrentUserService at app boot. */
  readonly avatarUrl = this.currentUserService.currentAvatarUrl;

  ngOnInit(): void {
    this.bindPeopleSearch();

    if (!this.isAuthenticated) return;
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      this.notificationCenter.connectRealtime(accessToken);
    }
    this.subs.add(this.notificationCenter.load().subscribe());
    this.subs.add(
      timer(3000, NOTIFICATION_COUNT_REFRESH_MS).pipe(
        switchMap(() => this.notificationCenter.refreshCount())
      ).subscribe({ error: () => undefined })
    );
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

  get userRole(): string | null {
    return this.tokenService.getRole();
  }

  get canAccessMembershipArea(): boolean {
    return this.userRole === 'MEMBER';
  }

  get canBrowsePlans(): boolean {
    return !this.isAuthenticated || this.canAccessMembershipArea;
  }

  get canBrowseSessions(): boolean {
    return this.userRole === 'MEMBER';
  }

  get isHome(): boolean {
    const url = this.router.url;
    return url === '/home' || url === '/';
  }

  get headerClass(): string {
    return this.isHome ? 'header header-trans' : 'header header-sticky';
  }

  get logoSrc(): string {
    return this.isHome ? 'assets/img/logo.png' : 'assets/img/logo-black.svg';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
    document.body.classList.toggle('menu-opened', this.isMobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    document.body.classList.remove('menu-opened');
  }

  onPeopleSearchFocus(): void {
    if (this.peopleQuery.length >= 2 || this.peopleSearchLoading()) {
      this.peopleSearchOpen.set(true);
    }
  }

  onPeopleSearchSubmit(): void {
    const query = this.peopleQuery;
    if (!query) return;

    this.peopleSearchOpen.set(false);
    this.router.navigate(['/people'], { queryParams: { q: query } });
  }

  clearPeopleSearch(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.peopleSearchControl.setValue('');
    this.peopleSearchResults.set([]);
    this.peopleSearchLoading.set(false);
    this.peopleSearchError.set(false);
    this.peopleSearchOpen.set(false);
  }

  openPeopleSearchPage(query?: string): void {
    const value = (query ?? this.peopleQuery).trim();
    if (!value) return;

    this.peopleSearchOpen.set(false);
    this.router.navigate(['/people'], { queryParams: { q: value } });
  }

  get peopleQuery(): string {
    return this.peopleSearchControl.value.trim();
  }

  get peopleHintText(): string {
    if (this.peopleSearchError()) return 'We hit a snag. Press Enter to continue in the full search.';
    if (this.peopleQuery.length < 2) return 'Search members and coaches without leaving the page.';
    return 'Press Enter to open the full People search.';
  }

  getPeopleInitials(person: UserSearchResult): string {
    const first = person.firstName?.[0] ?? '';
    const last = person.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || person.username[0]?.toUpperCase() || 'U';
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

  isChatNotification(notification: AppNotification): boolean {
    return notification.type === 'CHAT_MESSAGE_RECEIVED';
  }

  isPaymentNotification(notification: AppNotification): boolean {
    return notification.type === 'PAYMENT_COMPLETED'
      || notification.type === 'PAYMENT_FAILED'
      || notification.type === 'PAYMENT_EXPIRED';
  }

  isPaymentSuccessNotification(notification: AppNotification): boolean {
    return notification.type === 'PAYMENT_COMPLETED';
  }

  notificationIcon(notification: AppNotification): string {
    switch (notification.type) {
      case 'CHAT_MESSAGE_RECEIVED':
        return 'feather-message-circle';
      case 'PAYMENT_COMPLETED':
        return 'feather-check-circle';
      case 'PAYMENT_FAILED':
        return 'feather-alert-circle';
      case 'PAYMENT_EXPIRED':
        return 'feather-clock';
      default:
        return 'feather-bell';
    }
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

  private bindPeopleSearch(): void {
    this.subs.add(
      this.peopleSearchControl.valueChanges.pipe(
        debounceTime(220),
        distinctUntilChanged(),
        tap(value => {
          const query = value.trim();
          if (query.length < 2) {
            this.peopleSearchResults.set([]);
            this.peopleSearchLoading.set(false);
            this.peopleSearchError.set(false);
            this.peopleSearchOpen.set(false);
          }
        }),
        switchMap(value => {
          const query = value.trim();
          if (query.length < 2) {
            return of(null);
          }

          this.peopleSearchLoading.set(true);
          this.peopleSearchError.set(false);
          this.peopleSearchOpen.set(true);

          return this.peopleService.search(query).pipe(
            tap(response => {
              this.peopleSearchResults.set(response.items);
            }),
            catchError(() => {
              this.peopleSearchError.set(true);
              return of([] as UserSearchResult[]);
            })
          );
        })
      ).subscribe(results => {
        if (results === null) return;
        this.peopleSearchLoading.set(false);
        if (Array.isArray(results)) {
          this.peopleSearchResults.set(results);
        } else {
          this.peopleSearchResults.set(results.items);
        }
        this.peopleSearchOpen.set(true);
      })
    );
  }
}
