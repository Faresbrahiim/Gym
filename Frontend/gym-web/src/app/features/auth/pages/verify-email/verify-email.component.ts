import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card.component';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-verify-email',
  imports: [RouterLink, AuthCardComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {

  isLoading           = signal(true);
  verificationSuccess = signal(false);
  errorMessage        = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid verification link.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.verificationSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.status === 403
          ? 'This verification link is invalid or has expired.'
          : 'Something went wrong. Please try again later.');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
