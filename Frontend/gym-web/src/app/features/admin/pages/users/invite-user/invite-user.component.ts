import { Component, signal, inject, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminUserService } from '../../../services/admin-user.service';
import { ErrorService } from '../../../../../core/services/error.service';
import { LoadingButtonComponent } from '../../../../../shared/components/loading-button/loading-button.component';
import { emailValidators } from '../../../../../shared/validators/email.validator';

type Tab = 'member' | 'coach';

@Component({
  standalone: true,
  selector: 'app-invite-user',
  imports: [ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './invite-user.component.html',
  styleUrl: './invite-user.component.css'
})
export class InviteUserComponent {

  activeTab  = signal<Tab>('member');
  isLoading  = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg   = signal<string | null>(null);

  memberForm: FormGroup;
  coachForm:  FormGroup;

  private readonly destroyRef    = inject(DestroyRef);
  private readonly adminService  = inject(AdminUserService);
  private readonly errorService  = inject(ErrorService);

  constructor(private fb: FormBuilder) {
    this.memberForm = this.fb.group({
      email:    ['', emailValidators],
      username: ['', [Validators.required, Validators.maxLength(50)]]
    });

    this.coachForm = this.fb.group({
      email:    ['', emailValidators],
      username: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.clearFeedback();
  }

  onSubmit(): void {
    const form = this.activeForm;
    if (this.isLoading() || form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.clearFeedback();

    const { email, username } = form.value;
    const request$ = this.activeTab() === 'member'
      ? this.adminService.createMember({ email, username })
      : this.adminService.createCoach({ email, username });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMsg.set(`Invitation sent to ${email}`);
        form.reset();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set(this.errorService.extractMessage(err));
      }
    });
  }

  sendAnother(): void {
    this.clearFeedback();
    this.activeForm.reset();
  }

  get activeForm(): FormGroup {
    return this.activeTab() === 'member' ? this.memberForm : this.coachForm;
  }

  private clearFeedback(): void {
    this.successMsg.set(null);
    this.errorMsg.set(null);
  }

  // Field-level error helpers
  fieldError(form: FormGroup, field: string): string | null {
    const ctrl = form.get(field);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required'])   return 'This field is required.';
    if (ctrl.errors?.['pattern'])    return 'Enter a valid email address.';
    if (ctrl.errors?.['maxlength'])  return 'Too long (max 50 characters).';
    return 'Invalid value.';
  }
}
