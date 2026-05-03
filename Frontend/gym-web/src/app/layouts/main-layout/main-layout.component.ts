import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ChatPopupComponent } from '../../features/chat/components/chat-popup/chat-popup.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { SessionHeartbeatService } from '../../core/services/session-heartbeat.service';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, ChatPopupComponent],
  template: `
    <div class="main-wrapper">
      <app-header />
      <router-outlet />
      @if (!isImmersiveRoute()) {
        <app-footer />
        <app-chat-popup />
      }
    </div>
    <app-toast />
  `
})
export class MainLayoutComponent implements OnDestroy {
  private readonly router    = inject(Router);
  private readonly heartbeat = inject(SessionHeartbeatService);

  constructor() {
    this.heartbeat.start();
  }

  ngOnDestroy(): void {
    this.heartbeat.stop();
  }

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isImmersiveRoute = computed(() => {
    const currentUrl = this.currentUrl();
    return currentUrl.startsWith('/chat') || currentUrl.startsWith('/ai-coach');
  });
}
