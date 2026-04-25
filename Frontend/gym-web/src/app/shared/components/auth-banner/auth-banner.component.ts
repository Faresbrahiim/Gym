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

  get imageSrc(): string {
    return this.modifierClass === 'register'
      ? 'assets/img/bg/register-bg.jpg'
      : 'assets/img/bg/login-bg.jpg';
  }

  get imageAlt(): string {
    return this.modifierClass === 'register' ? 'Register banner' : 'Login banner';
  }
}
