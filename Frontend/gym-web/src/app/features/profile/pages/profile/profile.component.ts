import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { TokenService } from '../../../../core/auth/token.service';
import { UserMe } from '../../models/user-me.model';
import { UpdateProfileRequest } from '../../models/update-profile-request.model';
import { UpdateMemberProfileRequest } from '../../models/update-member-profile-request.model';
import { UpdateCoachProfileRequest } from '../../models/update-coach-profile-request.model';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
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
      phone:     ['']
    });

    this.memberForm = this.fb.group({
      gender:         [''],
      dateOfBirth:    [''],
      heightCm:       [null],
      weightKg:       [null],
      fitnessGoal:    [''],
      experienceLevel:['']
    });

    this.coachForm = this.fb.group({
      bio:              [''],
      yearsOfExperience:[null],
      certifications:   [''],
      language:         ['']
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
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private patchForms(data: UserMe): void {
    if (data.profile) {
      this.profileForm.patchValue({
        firstName: data.profile.firstName,
        lastName:  data.profile.lastName,
        phone:     data.profile.phone ?? ''
      });

      if (data.profile.profilePictureUrl) {
        this.avatarPreview.set(data.profile.profilePictureUrl);
      }
    }

    if (data.memberProfile) {
      this.memberForm.patchValue({
        gender:          data.memberProfile.gender ?? '',
        dateOfBirth:     data.memberProfile.dateOfBirth
                           ? data.memberProfile.dateOfBirth.substring(0, 10)
                           : '',
        heightCm:        data.memberProfile.heightCm,
        weightKg:        data.memberProfile.weightKg,
        fitnessGoal:     data.memberProfile.fitnessGoal ?? '',
        experienceLevel: data.memberProfile.experienceLevel !== null
                           ? String(data.memberProfile.experienceLevel)
                           : ''
      });
    }

    if (data.coachProfile) {
      this.coachForm.patchValue({
        bio:               data.coachProfile.bio ?? '',
        yearsOfExperience: data.coachProfile.yearsOfExperience,
        certifications:    data.coachProfile.certifications ?? '',
        language:          data.coachProfile.language ?? ''
      });
    }

    this.profileForm.markAsPristine();
    this.memberForm.markAsPristine();
    this.coachForm.markAsPristine();
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
        this.profileSuccess.set(true);
        this.pendingAvatarFile.set(null);
        this.profileForm.markAsPristine();
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: () => {
        this.isSavingProfile.set(false);
        this.profileError.set('Failed to save. Please try again.');
      }
    });
  }

  onSaveMemberProfile(): void {
    if (this.isSavingExtra()) return;

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
        this.extraSuccess.set(true);
        this.memberForm.markAsPristine();
        setTimeout(() => this.extraSuccess.set(false), 3000);
      },
      error: () => {
        this.isSavingExtra.set(false);
        this.extraError.set('Failed to save. Please try again.');
      }
    });
  }

  onSaveCoachProfile(): void {
    if (this.isSavingExtra()) return;

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
        this.extraSuccess.set(true);
        this.coachForm.markAsPristine();
        setTimeout(() => this.extraSuccess.set(false), 3000);
      },
      error: () => {
        this.isSavingExtra.set(false);
        this.extraError.set('Failed to save. Please try again.');
      }
    });
  }

  get fullName(): string {
    const p = this.userMe()?.profile;
    if (!p) return this.userMe()?.username ?? '';
    return `${p.firstName} ${p.lastName}`.trim();
  }
}
