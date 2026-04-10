import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { CurrentUserService } from '../../../core/services/current-user.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html'
})
export class HeaderComponent {

  private readonly authService       = inject(AuthService);
  private readonly tokenService      = inject(TokenService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly router            = inject(Router);

  isMobileMenuOpen = signal(false);
  isScrolled       = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 0);
  }

  /** Reactive avatar URL — hydrated by CurrentUserService at app boot. */
  readonly avatarUrl = this.currentUserService.currentAvatarUrl;

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

  onLogout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
