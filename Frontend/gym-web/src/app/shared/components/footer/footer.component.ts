import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';

declare var $: any;

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html'
})
export class FooterComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    // Initialize select2 on footer language/currency selects.
    // FooterComponent lives for the entire session once the MainLayout mounts,
    // so a single init here covers all pages.
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.lang-select .select').each(function(this: HTMLElement) {
          if (!$(this).hasClass('select2-hidden-accessible')) {
            $(this).select2({ minimumResultsForSearch: -1, width: '100%' });
          }
        });
      }
    }, 100);
  }
}
