import { Component, inject, signal, OnInit, ViewChild, ElementRef, DestroyRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { ProfileService } from '../../../features/profile/services/profile.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

  @ViewChild('headerEl', { static: true }) private headerEl!: ElementRef<HTMLElement>;

  private readonly authService    = inject(AuthService);
  private readonly tokenService   = inject(TokenService);
  private readonly profileService = inject(ProfileService);
  private readonly router         = inject(Router);
  private readonly destroyRef     = inject(DestroyRef);

  isMobileMenuOpen = signal(false);

  /** Reactive avatar URL maintained by ProfileService */
  readonly avatarUrl = this.profileService.currentAvatarUrl;

  /** Reactive username maintained by ProfileService; falls back to email from token */
  get username(): string {
    const fromProfile = this.profileService.currentUsername();
    if (fromProfile) return fromProfile;
    return this.tokenService.getEmail() ?? 'User';
  }

  get isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  ngOnInit(): void {
    // Only fetch profile when the user is logged in
    if (this.isAuthenticated) {
      this.profileService.getMe().pipe(catchError(() => EMPTY)).subscribe();
    }

    // On every route change, clear any inline background that jQuery's scroll handler
    // set on the previous page. Without this, scrolling on /home sets
    // background:#177c82 as an inline style which persists (overriding CSS) when
    // navigating to /profile or any other route.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.headerEl.nativeElement.style.removeProperty('background');
    });
  }

  /** True when the current route is the landing/home page */
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

  onLogout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
