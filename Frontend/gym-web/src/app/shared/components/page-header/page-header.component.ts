import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  standalone: true,
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() image = 'breadcrumb-bg2.jpg';
  @Input() position = 'center top';

  private sanitizer = inject(DomSanitizer);

  get backgroundImage(): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(
      `url('/assets/img/bg/${this.image}')`
    );
  }
}
