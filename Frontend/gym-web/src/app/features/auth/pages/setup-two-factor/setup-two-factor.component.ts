import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { AuthService } from '../../services/auth.service';

type SetupPhase = 'intro' | 'loading' | 'scan' | 'success' | 'error';

@Component({
  standalone: true,
  selector: 'app-setup-two-factor',
  imports: [ReactiveFormsModule, AuthCardComponent, LoadingButtonComponent],
  templateUrl: './setup-two-factor.component.html',
  styleUrl: './setup-two-factor.component.css'
})
export class SetupTwoFactorComponent implements OnInit {

  phase = signal<SetupPhase>('intro');
  qrCodeDataUri = signal<string | null>(null);
  manualKey = signal<string | null>(null);
  recoveryCodes = signal<string[]>([]);
  isConfirming = signal(false);
  confirmError = signal<string | null>(null);

  codeForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6,8}$/)]]
    });
  }

  ngOnInit(): void {
    // Setup is initiated explicitly by the user via startSetup().
    // Do NOT call the setup API here — doing so would overwrite any existing
    // TwoFactorSecret in the backend, silently breaking 2FA for users who
    // already have it enabled.
  }

  startSetup(): void {
    this.loadSetup();
  }

  private loadSetup(): void {
    this.phase.set('loading');

    this.authService.setupTwoFactor().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.qrCodeDataUri.set(`data:image/png;base64,${response.qrCodeImage}`);
        this.manualKey.set(response.manualKey);
        this.phase.set('scan');
      },
      error: () => {
        this.phase.set('error');
      }
    });
  }

  onSubmit(): void {
    if (this.isConfirming()) return;

    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isConfirming.set(true);
    this.confirmError.set(null);

    this.authService.confirmTwoFactor(this.codeForm.value.code).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.recoveryCodes.set(response.recoveryCodes);
        this.isConfirming.set(false);
        this.phase.set('success');
      },
      error: () => {
        this.isConfirming.set(false);
        this.confirmError.set('Could not enable 2FA. Please check the code and try again.');
      }
    });
  }

  retrySetup(): void {
    this.codeForm.reset();
    this.confirmError.set(null);
    this.loadSetup();
  }
}
