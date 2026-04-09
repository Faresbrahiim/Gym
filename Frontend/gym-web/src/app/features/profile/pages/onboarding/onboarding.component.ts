import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../services/profile.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ErrorService } from '../../../../core/services/error.service';
import { UpdateMemberProfileRequest } from '../../models/update-member-profile-request.model';
import { UpdateCoachProfileRequest } from '../../models/update-coach-profile-request.model';

@Component({
  standalone: true,
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class OnboardingComponent implements OnInit {

  isCheckingProfile = signal(true);
  isSaving          = signal(false);
  errorMessage      = signal<string | null>(null);

  memberForm!: FormGroup;
  coachForm!: FormGroup;

  role: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private tokenService: TokenService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.tokenService.getRole();

    // Admins never onboard
    if (this.role === 'ADMIN') {
      this.router.navigate(['/home']);
      return;
    }

    this.buildForms();
    this.checkAlreadyOnboarded();
  }

  private buildForms(): void {
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

  private checkAlreadyOnboarded(): void {
    this.profileService.getMe().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        const alreadyDone = this.role === 'MEMBER'
          ? data.memberProfile !== null
          : data.coachProfile !== null;

        if (alreadyDone) {
          this.router.navigate(['/profile']);
          return;
        }

        this.isCheckingProfile.set(false);
      },
      error: () => {
        // On error let the user see the form — worst case the save will fail gracefully
        this.isCheckingProfile.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const save$ = this.role === 'MEMBER'
      ? this.profileService.updateMemberProfile(this.buildMemberDto())
      : this.profileService.updateCoachProfile(this.buildCoachDto());

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.errorService.extractMessage(err));
      }
    });
  }

  skip(): void {
    this.router.navigate(['/home']);
  }

  private buildMemberDto(): UpdateMemberProfileRequest {
    const v = this.memberForm.value;
    const dto: UpdateMemberProfileRequest = {};
    if (v.gender)      dto.gender      = v.gender;
    if (v.dateOfBirth) dto.dateOfBirth = v.dateOfBirth;
    if (v.heightCm)    dto.heightCm    = Number(v.heightCm);
    if (v.weightKg)    dto.weightKg    = Number(v.weightKg);
    if (v.fitnessGoal) dto.fitnessGoal = v.fitnessGoal;
    if (v.experienceLevel !== '' && v.experienceLevel !== null && v.experienceLevel !== undefined) {
      dto.experienceLevel = Number(v.experienceLevel);
    }
    return dto;
  }

  private buildCoachDto(): UpdateCoachProfileRequest {
    const v = this.coachForm.value;
    const dto: UpdateCoachProfileRequest = {};
    if (v.bio)            dto.bio            = v.bio;
    if (v.yearsOfExperience !== null && v.yearsOfExperience !== '') {
      dto.yearsOfExperience = Number(v.yearsOfExperience);
    }
    if (v.certifications) dto.certifications = v.certifications;
    if (v.language)       dto.language       = v.language;
    return dto;
  }
}
