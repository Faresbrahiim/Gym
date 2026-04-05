import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="main-wrapper">
      <app-header />
      <router-outlet />
      <app-footer />
    </div>
  `
})
export class MainLayoutComponent {}
