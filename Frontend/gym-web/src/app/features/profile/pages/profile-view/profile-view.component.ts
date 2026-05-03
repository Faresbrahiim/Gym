import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { TokenService } from '../../../../core/auth/token.service';
import { UserMe } from '../../models/user-me.model';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

@Component({
  standalone: true,
  selector: 'app-profile-view',
  imports: [CommonModule, RouterLink, DashboardMenuComponent, PageHeaderComponent],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.css'
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

  get completionScore(): number {
    const me = this.userMe();
    const profile = me?.profile;
    let completed = 0;

    if (profile?.firstName && profile?.lastName) completed += 1;
    if (profile?.profilePictureUrl) completed += 1;
    if (profile?.phone) completed += 1;
    if (this.hasRoleDetails) completed += 1;

    return Math.round((completed / 4) * 100);
  }

  get completionTone(): string {
    if (this.completionScore >= 100) return 'Complete';
    if (this.completionScore >= 75) return 'Strong';
    if (this.completionScore >= 50) return 'In Progress';
    return 'Getting Started';
  }

  get accountFacts(): Array<{ label: string; value: string }> {
    const me = this.userMe();

    return [
      { label: 'Full Name', value: this.fullName || 'Not added yet' },
      { label: 'Username', value: me ? `@${me.username}` : 'Not available' },
      { label: 'Email', value: me?.email ?? 'Not available' },
      { label: 'Role', value: this.roleLabel },
      { label: 'Phone', value: me?.profile?.phone ?? 'Add this in edit profile' }
    ];
  }

  get roleFacts(): Array<{ label: string; value: string }> {
    const me = this.userMe();

    if (this.role === 'COACH') {
      const coach = me?.coachProfile;
      return [
        { label: 'Experience', value: coach?.yearsOfExperience !== null && coach?.yearsOfExperience !== undefined ? `${coach.yearsOfExperience} years` : 'Not added yet' },
        { label: 'Certifications', value: coach?.certifications || 'Add credentials in edit profile' },
        { label: 'Language', value: coach?.language || 'Not added yet' }
      ];
    }

    const member = me?.memberProfile;
    return [
      { label: 'Gender', value: member?.gender || 'Not added yet' },
      { label: 'Date of Birth', value: this.formattedDob || 'Not added yet' },
      { label: 'Height', value: member?.heightCm ? `${member.heightCm} cm` : 'Not added yet' },
      { label: 'Weight', value: member?.weightKg ? `${member.weightKg} kg` : 'Not added yet' },
      { label: 'Goal', value: member?.fitnessGoal || 'Add your fitness goal' },
      { label: 'Experience', value: this.experienceLabel || 'Not added yet' }
    ];
  }

  get roleCardTitle(): string {
    if (this.role === 'COACH') return 'Coach Snapshot';
    if (this.role === 'MEMBER') return 'Fitness Snapshot';
    return 'Profile Snapshot';
  }

  get roleCardDescription(): string {
    if (this.role === 'COACH') {
      return 'This is the information members will use to understand your coaching background and style.';
    }
    if (this.role === 'MEMBER') {
      return 'These details shape the training profile attached to your account.';
    }
    return 'Role-specific details attached to this profile.';
  }

  get roleSummaryNote(): string {
    if (this.role === 'COACH') {
      return this.userMe()?.coachProfile?.bio || 'Add a short coach bio in Edit Profile so members understand your approach before chatting with you.';
    }
    return 'Keep your fitness profile current so goals, experience, and body metrics stay aligned with the rest of your gym journey.';
  }

  get profileChecklist(): Array<{ label: string; done: boolean; detail: string }> {
    const me = this.userMe();
    const profile = me?.profile;

    return [
      {
        label: 'Identity',
        done: !!profile?.firstName && !!profile?.lastName,
        detail: !!profile?.firstName && !!profile?.lastName ? 'Name is visible across the app.' : 'Add your full name.'
      },
      {
        label: 'Photo',
        done: !!profile?.profilePictureUrl,
        detail: !!profile?.profilePictureUrl ? 'Avatar is ready for chat and profile.' : 'Upload a recognizable profile photo.'
      },
      {
        label: 'Contact',
        done: !!profile?.phone,
        detail: !!profile?.phone ? 'Phone number is saved.' : 'Add a phone number for completeness.'
      },
      {
        label: this.role === 'COACH' ? 'Coach Details' : 'Fitness Details',
        done: this.hasRoleDetails,
        detail: this.hasRoleDetails ? 'Role-specific information is available.' : 'Complete your role-specific profile.'
      }
    ];
  }

  private get hasRoleDetails(): boolean {
    if (this.role === 'COACH') {
      const coach = this.userMe()?.coachProfile;
      return !!(coach?.bio || coach?.certifications || coach?.language || coach?.yearsOfExperience !== null && coach?.yearsOfExperience !== undefined);
    }

    const member = this.userMe()?.memberProfile;
    return !!(member?.gender || member?.fitnessGoal || member?.heightCm || member?.weightKg || member?.dateOfBirth || member?.experienceLevel !== null && member?.experienceLevel !== undefined);
  }
}
