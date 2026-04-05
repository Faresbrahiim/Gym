import { Component, AfterViewInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// jQuery and plugins are loaded globally via angular.json scripts
declare var $: any;
declare var AOS: any;

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    // Angular renders components after document.ready fires, so all jQuery plugin
    // initializations in script.js missed the DOM. Re-initialize them here.
    setTimeout(() => this.initPlugins(), 100);
  }

  private initPlugins(): void {
    if (typeof $ === 'undefined') return;

    // ── Owl Carousels ──────────────────────────────────────────────────────────

    if ($.fn.owlCarousel) {

      // Safely initialize a carousel (destroy first if already initialized)
      const initOwl = (selector: string, options: object) => {
        const el = $(selector);
        if (!el.length) return;
        if (el.hasClass('owl-loaded')) {
          el.trigger('destroy.owl.carousel').removeClass('owl-loaded owl-drag');
        }
        el.owlCarousel(options);
      };

      initOwl('.featured-venues-slider', {
        loop: true, margin: 24, nav: true, dots: false, autoplay: false, smartSpeed: 2000,
        navText: ["<i class='feather-chevron-left'></i>", "<i class='feather-chevron-right'></i>"],
        responsive: { 0: { items: 1 }, 500: { items: 1 }, 768: { items: 2 }, 1000: { items: 3 } }
      });

      initOwl('.featured-coache-slider', {
        loop: true, margin: 24, nav: true, dots: false, autoplay: false, smartSpeed: 2000,
        navText: ["<i class='feather-chevron-left'></i>", "<i class='feather-chevron-right'></i>"],
        responsive: { 0: { items: 1 }, 500: { items: 1 }, 768: { items: 2 }, 1000: { items: 4 } }
      });

      initOwl('.testimonial-brand-slider', {
        loop: true, margin: 60, nav: false, dots: false, autoplay: true, smartSpeed: 2000,
        responsive: { 0: { items: 1 }, 500: { items: 1 }, 768: { items: 3 }, 1000: { items: 5 } }
      });

      // Testimonial slide carousel (different class used on the testimonials section)
      initOwl('.testimonial-slide', {
        loop: true, margin: 24, nav: true, dots: false, autoplay: false, smartSpeed: 2000,
        navText: ["<i class='feather-chevron-left'></i>", "<i class='feather-chevron-right'></i>"],
        responsive: { 0: { items: 1 }, 500: { items: 1 }, 768: { items: 2 }, 1000: { items: 3 } }
      });
    }

    // ── AOS (Animate on Scroll) ────────────────────────────────────────────────
    if (typeof AOS !== 'undefined') {
      // init is safe to call multiple times; it re-observes elements
      AOS.init({ duration: 1200, once: true });
    }

    // ── Select2 ────────────────────────────────────────────────────────────────
    if ($.fn.select2) {
      // Hero search selects
      $('.search-box .select').each(function(this: HTMLElement) {
        if (!$(this).hasClass('select2-hidden-accessible')) {
          $(this).select2({ minimumResultsForSearch: -1, width: '100%' });
        }
      });
    }

    // ── CounterUp ──────────────────────────────────────────────────────────────
    if ($.fn.counterUp) {
      $('.coach-count .counter-up').counterUp({ delay: 15, time: 1500 });
    }

    // ── Favourite icon toggle ──────────────────────────────────────────────────
    $('.fav-icon').off('click.home').on('click.home', function(this: HTMLElement) {
      $(this).toggleClass('selected');
    });
  }
}
