import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of } from 'rxjs';
import { ProfileService } from '../../../profile/services/profile.service';
import { TokenService } from '../../../../core/auth/token.service';
import { ErrorService } from '../../../../core/services/error.service';
import { UserMe } from '../../../profile/models/user-me.model';
import { UpdateProfileRequest } from '../../../profile/models/update-profile-request.model';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';

const DEFAULT_AVATAR = '/assets/img/profiles/avatar-01.jpg';

@Component({
  standalone: true,
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.css'
})
export class AdminProfileComponent implements OnInit {

  readonly DEFAULT_AVATAR = DEFAULT_AVATAR;

  isLoading         = signal(true);
  isSaving          = signal(false);
  successMsg        = signal<string | null>(null);
  errorMsg          = signal<string | null>(null);
  avatarError       = signal<string | null>(null);
  userMe            = signal<UserMe | null>(null);
  avatarPreview     = signal(DEFAULT_AVATAR);
  pendingAvatarFile = signal<File | null>(null);

  profileForm!: FormGroup;

  private readonly destroyRef   = inject(DestroyRef);
  private readonly profileService = inject(ProfileService);
  private readonly tokenService   = inject(TokenService);
  private readonly errorService   = inject(ErrorService);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      phone:     ['']
    });

    this.profileService.getMe().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.userMe.set(data);
        this.patchForm(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set(this.errorService.extractMessage(err));
      }
    });
  }

  private patchForm(data: UserMe): void {
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
    this.profileForm.markAsPristine();
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

  onSave(): void {
    if (this.isSaving() || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    if (this.profileForm.pristine && !this.pendingAvatarFile()) return;

    this.isSaving.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

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
        this.isSaving.set(false);
        this.successMsg.set('Profile updated successfully.');
        this.pendingAvatarFile.set(null);
        this.profileForm.markAsPristine();
        setTimeout(() => this.successMsg.set(null), 3500);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMsg.set(this.errorService.extractMessage(err));
      }
    });
  }

  fieldError(field: string): string | null {
    const ctrl = this.profileForm.get(field);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'This field is required.';
    return 'Invalid value.';
  }

  get fullName(): string {
    const p = this.userMe()?.profile;
    if (!p) return this.userMe()?.username ?? '';
    return `${p.firstName} ${p.lastName}`.trim();
  }
}
