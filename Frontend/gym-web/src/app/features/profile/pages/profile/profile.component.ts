import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DashboardMenuComponent } from '../../../../shared/components/dashboard-menu/dashboard-menu.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserMe } from '../../models/user-me.model';
import { UpdateProfileRequest } from '../../models/update-profile-request.model';
import { UpdateMemberProfileRequest } from '../../models/update-member-profile-request.model';
import { UpdateCoachProfileRequest } from '../../models/update-coach-profile-request.model';
import { moroccanPhoneValidators } from '../../../../shared/validators/phone.validator';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink, DashboardMenuComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  readonly DEFAULT_AVATAR = DEFAULT_AVATAR;

  isLoading         = signal(true);
  isSavingProfile   = signal(false);
  isSavingExtra     = signal(false);
  profileSuccess    = signal(false);
  extraSuccess      = signal(false);
  profileError      = signal<string | null>(null);
  extraError        = signal<string | null>(null);
  avatarError       = signal<string | null>(null);
  userMe            = signal<UserMe | null>(null);
  activeTab         = signal<'personal' | 'extra'>('personal');
  avatarPreview     = signal(DEFAULT_AVATAR);
  pendingAvatarFile = signal<File | null>(null);

  profileForm!: FormGroup;
  memberForm!: FormGroup;
  coachForm!: FormGroup;

  role: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private tokenService: TokenService,
    private errorService: ErrorService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.tokenService.getRole();
    this.buildForms();
    this.loadProfile();
  }

  private buildForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      phone:     ['', moroccanPhoneValidators]
    });

    this.memberForm = this.fb.group({
      gender:         [''],
      dateOfBirth:    [''],
      heightCm:       [null, [Validators.min(50), Validators.max(300)]],
      weightKg:       [null, [Validators.min(20), Validators.max(500)]],
      fitnessGoal:    ['', Validators.maxLength(255)],
      experienceLevel:['']
    });

    this.coachForm = this.fb.group({
      bio:              ['', Validators.maxLength(1000)],
      yearsOfExperience:[null, [Validators.min(0), Validators.max(60)]],
      certifications:   ['', Validators.maxLength(500)],
      language:         ['', Validators.maxLength(100)]
    });
  }

  private loadProfile(): void {
    this.profileService.getMe().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        // Redirect to onboarding if role-specific profile is missing
        if (this.role === 'MEMBER' && data.memberProfile === null) {
          this.router.navigate(['/profile/onboarding']);
          return;
        }
        if (this.role === 'COACH' && data.coachProfile === null) {
          this.router.navigate(['/profile/onboarding']);
          return;
        }

        this.userMe.set(data);
        this.patchForms(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error(this.errorService.extractMessage(err));
      }
    });
  }

  private patchForms(data: UserMe): void {
    this.patchPersonalForm(data);
    this.patchMemberForm(data);
    this.patchCoachForm(data);
  }

  setTab(tab: 'personal' | 'extra'): void {
    this.activeTab.set(tab);
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = DEFAULT_AVATAR;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target!.result as string);
    reader.readAsDataURL(file);

    this.pendingAvatarFile.set(file);
    this.avatarError.set(null);
  }

  onSaveProfile(): void {
    if (this.isSavingProfile() || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    this.profileError.set(null);
    this.profileSuccess.set(false);

    const v = this.profileForm.value;
    const dto: UpdateProfileRequest = {};
    if (v.firstName) dto.firstName = v.firstName;
    if (v.lastName)  dto.lastName  = v.lastName;
    if (v.phone)     dto.phone     = v.phone;

    const pendingFile = this.pendingAvatarFile();
    const avatar$: Observable<{ url: string } | null> = pendingFile
      ? this.profileService.uploadAvatar(pendingFile)
      : of(null);

    avatar$.pipe(
      switchMap((res) => {
        if (res) this.avatarPreview.set(res.url);
        return this.profileService.updateProfile(dto);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.syncUserMeWithProfile(dto);
        this.profileSuccess.set(true);
        this.pendingAvatarFile.set(null);
        this.profileForm.markAsPristine();
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.profileError.set(this.errorService.extractMessage(err));
      }
    });
  }

  onSaveMemberProfile(): void {
    if (this.isSavingExtra() || this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSavingExtra.set(true);
    this.extraError.set(null);
    this.extraSuccess.set(false);

    const v = this.memberForm.value;
    const dto: UpdateMemberProfileRequest = {};
    if (v.gender)          dto.gender          = v.gender;
    if (v.dateOfBirth)     dto.dateOfBirth     = v.dateOfBirth;
    if (v.heightCm)        dto.heightCm        = Number(v.heightCm);
    if (v.weightKg)        dto.weightKg        = Number(v.weightKg);
    if (v.fitnessGoal)     dto.fitnessGoal     = v.fitnessGoal;
    if (v.experienceLevel !== '' && v.experienceLevel !== null && v.experienceLevel !== undefined) {
      dto.experienceLevel = Number(v.experienceLevel);
    }

    this.profileService.updateMemberProfile(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSavingExtra.set(false);
        this.syncUserMeWithMemberProfile(dto);
        this.extraSuccess.set(true);
        this.memberForm.markAsPristine();
        setTimeout(() => this.extraSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isSavingExtra.set(false);
        this.extraError.set(this.errorService.extractMessage(err));
      }
    });
  }

  onSaveCoachProfile(): void {
    if (this.isSavingExtra() || this.coachForm.invalid) {
      this.coachForm.markAllAsTouched();
      return;
    }

    this.isSavingExtra.set(true);
    this.extraError.set(null);
    this.extraSuccess.set(false);

    const v = this.coachForm.value;
    const dto: UpdateCoachProfileRequest = {};
    if (v.bio)               dto.bio               = v.bio;
    if (v.yearsOfExperience !== null && v.yearsOfExperience !== '') {
      dto.yearsOfExperience = Number(v.yearsOfExperience);
    }
    if (v.certifications)    dto.certifications    = v.certifications;
    if (v.language)          dto.language          = v.language;

    this.profileService.updateCoachProfile(dto).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isSavingExtra.set(false);
        this.syncUserMeWithCoachProfile(dto);
        this.extraSuccess.set(true);
        this.coachForm.markAsPristine();
        setTimeout(() => this.extraSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isSavingExtra.set(false);
        this.extraError.set(this.errorService.extractMessage(err));
      }
    });
  }

  get fullName(): string {
    const p = this.userMe()?.profile;
    if (!p) return this.userMe()?.username ?? '';
    return `${p.firstName} ${p.lastName}`.trim();
  }

  get roleLabel(): string {
    switch (this.role) {
      case 'MEMBER': return 'Member';
      case 'COACH': return 'Coach';
      case 'ADMIN': return 'Admin';
      default: return this.role ?? 'User';
    }
  }

  get extraTabLabel(): string {
    return this.role === 'COACH' ? 'Coach Profile' : 'Fitness Profile';
  }

  get activeSectionTitle(): string {
    return this.activeTab() === 'personal' ? 'Account Editor' : this.extraTabLabel;
  }

  get activeSectionDescription(): string {
    if (this.activeTab() === 'personal') {
      return 'Update the identity details people see across the app, including your avatar and contact information.';
    }

    return this.role === 'COACH'
      ? 'Refine the details that help members understand your background and coaching style.'
      : 'Keep your fitness data and goals current so your profile stays useful and complete.';
  }

  get personalDirty(): boolean {
    return !this.profileForm.pristine || !!this.pendingAvatarFile();
  }

  get extraDirty(): boolean {
    const form = this.role === 'COACH' ? this.coachForm : this.memberForm;
    return !form.pristine;
  }

  get activeDirty(): boolean {
    return this.activeTab() === 'personal' ? this.personalDirty : this.extraDirty;
  }

  get canSavePersonal(): boolean {
    return !this.isSavingProfile() && this.personalDirty && this.profileForm.valid;
  }

  get canSaveExtra(): boolean {
    const form = this.role === 'COACH' ? this.coachForm : this.memberForm;
    return !this.isSavingExtra() && !form.pristine && form.valid;
  }

  get completionScore(): number {
    const profile = this.userMe()?.profile;
    let completed = 0;

    if (profile?.firstName && profile?.lastName) completed += 1;
    if (profile?.profilePictureUrl || this.pendingAvatarFile()) completed += 1;
    if (profile?.phone) completed += 1;
    if (this.hasRoleDetails()) completed += 1;

    return Math.round((completed / 4) * 100);
  }

  get completionTone(): string {
    if (this.completionScore >= 100) return 'Complete';
    if (this.completionScore >= 75) return 'Strong';
    if (this.completionScore >= 50) return 'In Progress';
    return 'Getting Started';
  }

  get editorChecklist(): Array<{ label: string; done: boolean; detail: string }> {
    const profile = this.userMe()?.profile;

    return [
      {
        label: 'Identity',
        done: !!profile?.firstName && !!profile?.lastName,
        detail: !!profile?.firstName && !!profile?.lastName ? 'Name is set across the app.' : 'Add a complete full name.'
      },
      {
        label: 'Photo',
        done: !!profile?.profilePictureUrl || !!this.pendingAvatarFile(),
        detail: !!profile?.profilePictureUrl || !!this.pendingAvatarFile() ? 'Avatar is ready to use.' : 'Upload a recognizable profile photo.'
      },
      {
        label: 'Contact',
        done: !!profile?.phone,
        detail: !!profile?.phone ? 'Phone number is saved.' : 'Add a phone number.'
      },
      {
        label: this.extraTabLabel,
        done: this.hasRoleDetails(),
        detail: this.hasRoleDetails() ? 'Role-specific details are present.' : `Finish your ${this.extraTabLabel.toLowerCase()}.`
      }
    ];
  }

  get roleSummary(): string {
    if (this.role === 'COACH') {
      const coach = this.userMe()?.coachProfile;
      const parts: string[] = [];
      if (coach?.yearsOfExperience !== null && coach?.yearsOfExperience !== undefined) parts.push(`${coach.yearsOfExperience}+ years`);
      if (coach?.certifications) parts.push(coach.certifications);
      if (coach?.language) parts.push(coach.language);
      return parts.length ? parts.join(' • ') : 'Coach details have room for more clarity.';
    }

    const member = this.userMe()?.memberProfile;
    const parts: string[] = [];
    if (member?.fitnessGoal) parts.push(member.fitnessGoal);
    if (member?.experienceLevel !== null && member?.experienceLevel !== undefined) {
      parts.push(this.experienceLevelLabel(member.experienceLevel));
    }
    if (member?.heightCm) parts.push(`${member.heightCm} cm`);
    if (member?.weightKg) parts.push(`${member.weightKg} kg`);
    return parts.length ? parts.join(' • ') : 'Fitness details still need filling out.';
  }

  get experienceLevelLabelText(): string {
    const level = this.userMe()?.memberProfile?.experienceLevel;
    return level === null || level === undefined ? 'Not set yet' : this.experienceLevelLabel(level);
  }

  onDiscardActive(): void {
    const data = this.userMe();
    if (!data) return;

    if (this.activeTab() === 'personal') {
      this.patchPersonalForm(data);
      this.pendingAvatarFile.set(null);
      this.avatarError.set(null);
      this.profileError.set(null);
      this.profileSuccess.set(false);
      return;
    }

    if (this.role === 'COACH') {
      this.patchCoachForm(data);
    } else {
      this.patchMemberForm(data);
    }
    this.extraError.set(null);
    this.extraSuccess.set(false);
  }

  saveActiveSection(): void {
    if (this.activeTab() === 'personal') {
      this.onSaveProfile();
      return;
    }

    if (this.role === 'COACH') {
      this.onSaveCoachProfile();
      return;
    }

    this.onSaveMemberProfile();
  }

  private patchPersonalForm(data: UserMe): void {
    if (!data.profile) return;

    this.profileForm.patchValue({
      firstName: data.profile.firstName,
      lastName: data.profile.lastName,
      phone: data.profile.phone ?? ''
    });

    this.avatarPreview.set(data.profile.profilePictureUrl || DEFAULT_AVATAR);
    this.profileForm.markAsPristine();
  }

  private patchMemberForm(data: UserMe): void {
    if (!data.memberProfile) {
      this.memberForm.reset({
        gender: '',
        dateOfBirth: '',
        heightCm: null,
        weightKg: null,
        fitnessGoal: '',
        experienceLevel: ''
      });
      this.memberForm.markAsPristine();
      return;
    }

    this.memberForm.patchValue({
      gender: data.memberProfile.gender ?? '',
      dateOfBirth: data.memberProfile.dateOfBirth ? data.memberProfile.dateOfBirth.substring(0, 10) : '',
      heightCm: data.memberProfile.heightCm,
      weightKg: data.memberProfile.weightKg,
      fitnessGoal: data.memberProfile.fitnessGoal ?? '',
      experienceLevel: data.memberProfile.experienceLevel !== null ? String(data.memberProfile.experienceLevel) : ''
    });

    this.memberForm.markAsPristine();
  }

  private patchCoachForm(data: UserMe): void {
    if (!data.coachProfile) {
      this.coachForm.reset({
        bio: '',
        yearsOfExperience: null,
        certifications: '',
        language: ''
      });
      this.coachForm.markAsPristine();
      return;
    }

    this.coachForm.patchValue({
      bio: data.coachProfile.bio ?? '',
      yearsOfExperience: data.coachProfile.yearsOfExperience,
      certifications: data.coachProfile.certifications ?? '',
      language: data.coachProfile.language ?? ''
    });

    this.coachForm.markAsPristine();
  }

  private hasRoleDetails(): boolean {
    if (this.role === 'COACH') {
      const coach = this.userMe()?.coachProfile;
      return !!(coach?.bio || coach?.certifications || coach?.language || (coach?.yearsOfExperience !== null && coach?.yearsOfExperience !== undefined));
    }

    const member = this.userMe()?.memberProfile;
    return !!(member?.gender || member?.fitnessGoal || member?.heightCm || member?.weightKg || member?.dateOfBirth || (member?.experienceLevel !== null && member?.experienceLevel !== undefined));
  }

  private experienceLevelLabel(level: number): string {
    switch (level) {
      case 0: return 'Beginner';
      case 1: return 'Intermediate';
      case 2: return 'Advanced';
      default: return 'Unspecified level';
    }
  }

  private syncUserMeWithProfile(dto: UpdateProfileRequest): void {
    const current = this.userMe();
    if (!current || !current.profile) return;

    this.userMe.set({
      ...current,
      profile: {
        ...current.profile,
        firstName: dto.firstName ?? current.profile.firstName,
        lastName: dto.lastName ?? current.profile.lastName,
        phone: dto.phone ?? current.profile.phone,
        profilePictureUrl: this.avatarPreview()
      }
    });
  }

  private syncUserMeWithMemberProfile(dto: UpdateMemberProfileRequest): void {
    const current = this.userMe();
    if (!current) return;

    this.userMe.set({
      ...current,
      memberProfile: {
        gender: dto.gender ?? current.memberProfile?.gender ?? null,
        dateOfBirth: dto.dateOfBirth ?? current.memberProfile?.dateOfBirth ?? null,
        heightCm: dto.heightCm ?? current.memberProfile?.heightCm ?? null,
        weightKg: dto.weightKg ?? current.memberProfile?.weightKg ?? null,
        fitnessGoal: dto.fitnessGoal ?? current.memberProfile?.fitnessGoal ?? null,
        experienceLevel: dto.experienceLevel ?? current.memberProfile?.experienceLevel ?? null
      }
    });
  }

  private syncUserMeWithCoachProfile(dto: UpdateCoachProfileRequest): void {
    const current = this.userMe();
    if (!current) return;

    this.userMe.set({
      ...current,
      coachProfile: {
        bio: dto.bio ?? current.coachProfile?.bio ?? null,
        yearsOfExperience: dto.yearsOfExperience ?? current.coachProfile?.yearsOfExperience ?? null,
        certifications: dto.certifications ?? current.coachProfile?.certifications ?? null,
        language: dto.language ?? current.coachProfile?.language ?? ''
      }
    });
  }
}
