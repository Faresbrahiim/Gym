import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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

  private readonly authService    = inject(AuthService);
  private readonly tokenService   = inject(TokenService);
  private readonly profileService = inject(ProfileService);
  private readonly router         = inject(Router);

  isMobileMenuOpen = signal(false);
  isScrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 0);
  }

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
    if (this.isAuthenticated) {
      this.profileService.getMe().pipe(catchError(() => EMPTY)).subscribe();
    }
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
