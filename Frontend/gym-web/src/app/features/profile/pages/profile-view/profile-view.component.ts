import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { TokenService } from '../../../../core/auth/token.service';
import { UserMe } from '../../models/user-me.model';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

@Component({
  standalone: true,
  selector: 'app-profile-view',
  imports: [CommonModule, RouterLink, DashboardMenuComponent],
  templateUrl: './profile-view.component.html'
})
export class ProfileViewComponent implements OnInit {

  isLoading = signal(true);
  hasError  = signal(false);
  userMe    = signal<UserMe | null>(null);

  role: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private profileService: ProfileService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.tokenService.getRole();
    this.loadProfile();
  }

  private loadProfile(): void {
    this.profileService.getMe().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        if (this.role === 'MEMBER' && data.memberProfile === null) {
          this.router.navigate(['/profile/onboarding']);
          return;
        }
        if (this.role === 'COACH' && data.coachProfile === null) {
          this.router.navigate(['/profile/onboarding']);
          return;
        }
        this.userMe.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }

  retry(): void {
    this.hasError.set(false);
    this.isLoading.set(true);
    this.profileService.invalidateCache();
    this.loadProfile();
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = DEFAULT_AVATAR;
  }

  get avatarUrl(): string {
    return this.userMe()?.profile?.profilePictureUrl ?? DEFAULT_AVATAR;
  }

  get fullName(): string {
    const p = this.userMe()?.profile;
    if (!p) return this.userMe()?.username ?? '';
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    return name || (this.userMe()?.username ?? '');
  }

  get roleLabel(): string {
    switch (this.role) {
      case 'MEMBER': return 'Member';
      case 'COACH':  return 'Coach';
      case 'ADMIN':  return 'Admin';
      default:       return this.role ?? '';
    }
  }

  get roleBadgeColor(): string {
    switch (this.role) {
      case 'COACH': return '#177c82';
      case 'ADMIN': return '#6B7385';
      default:      return '#097E52';
    }
  }

  get experienceLabel(): string {
    const level = this.userMe()?.memberProfile?.experienceLevel;
    if (level === null || level === undefined) return '';
    switch (level) {
      case 0:  return 'Beginner';
      case 1:  return 'Intermediate';
      case 2:  return 'Advanced';
      default: return String(level);
    }
  }

  get formattedDob(): string {
    const dob = this.userMe()?.memberProfile?.dateOfBirth;
    if (!dob) return '';
    try {
      const parts = dob.substring(0, 10).split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dob.substring(0, 10);
    }
  }
}
