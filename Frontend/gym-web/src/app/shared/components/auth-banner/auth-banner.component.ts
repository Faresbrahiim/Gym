import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-auth-banner',
  templateUrl: './auth-banner.component.html',
  styleUrl: './auth-banner.component.css'
})
export class AuthBannerComponent {
  @Input() buttonText = '';
  @Input() description = '';
  @Input() modifierClass = '';
}
