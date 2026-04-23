import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ChatPopupComponent } from '../../features/chat/components/chat-popup/chat-popup.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, ChatPopupComponent],
  template: `
    <div class="main-wrapper">
      <app-header />
      <router-outlet />
      @if (!isChatRoute()) {
        <app-footer />
        <app-chat-popup />
      }
    </div>
    <app-toast />
  `
})
export class MainLayoutComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isChatRoute = computed(() => this.currentUrl().startsWith('/chat'));
}
