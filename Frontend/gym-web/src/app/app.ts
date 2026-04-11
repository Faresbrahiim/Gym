import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CurrentUserService } from './core/services/current-user.service';
import { TokenService } from './core/auth/token.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  protected readonly title = signal('gym-web');

  private readonly currentUserService = inject(CurrentUserService);
  private readonly tokenService       = inject(TokenService);

  ngOnInit(): void {
    if (this.tokenService.isAuthenticated()) {
      this.currentUserService.hydrate();
    }
  }
}
