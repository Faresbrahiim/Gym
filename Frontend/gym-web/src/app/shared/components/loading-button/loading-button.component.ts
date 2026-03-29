import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-loading-button',
  templateUrl: './loading-button.component.html'
})
export class LoadingButtonComponent {
  @Input() loading = false;
  @Input() type: 'submit' | 'button' | 'reset' = 'submit';
  @Input() cssClass = '';
}
