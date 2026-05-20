import { Component, AfterViewInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenService } from '../../core/auth/token.service';

declare var AOS: any;
declare var Swiper: any;

interface HeroAction {
  label: string;
  route: string;
}

const GUEST_ACTIONS: HeroAction[] = [
  {
    label: 'Get Started',
    route: '/register',
  },
  {
    label: 'View Plans',
    route: '/membership/plans',
  },
  {
    label: 'Explore Store',
    route: '/store',
  }
];

const MEMBER_ACTIONS: HeroAction[] = [
  {
    label: 'My Membership',
    route: '/membership',
  },
  {
    label: 'Book Session',
    route: '/bookings/sessions',
  },
  {
    label: 'Open Chat',
    route: '/chat',
  },
  {
    label: 'AI Coach',
    route: '/ai-coach',
  }
];

const COACH_ACTIONS: HeroAction[] = [
  {
    label: 'My Sessions',
    route: '/bookings/coach',
  },
  {
    label: 'Messages',
    route: '/chat',
  },
  {
    label: 'My Profile',
    route: '/profile',
  },
  {
    label: 'Security',
    route: '/profile/security',
  }
];

const ADMIN_ACTIONS: HeroAction[] = [
  {
    label: 'Dashboard',
    route: '/admin/dashboard',
  },
  {
    label: 'Users',
    route: '/admin/users/invite',
  },
  {
    label: 'Plans',
    route: '/admin/plans',
  },
  {
    label: 'Products',
    route: '/admin/products',
  }
];

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit {
  private readonly tokenService = inject(TokenService);

  protected get heroActions(): HeroAction[] {
    if (!this.tokenService.isAuthenticated()) {
      return GUEST_ACTIONS;
    }

    switch (this.tokenService.getRole()) {
      case 'MEMBER':
        return MEMBER_ACTIONS;
      case 'COACH':
        return COACH_ACTIONS;
      case 'ADMIN':
        return ADMIN_ACTIONS;
      default:
        return GUEST_ACTIONS;
    }
  }

  protected get heroActionTitle(): string {
    return 'Quick actions';
  }

  toggleFavourite(event: Event): void {
    (event.currentTarget as HTMLElement).classList.toggle('selected');
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.initAos();
      this.initSwipers();
      this.initCounters();
    });
  }

  // ── AOS (Animate on Scroll) ──────────────────────────────────────────────────
  private initAos(): void {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        startEvent: 'DOMContentLoaded'
      });
    }
  }

  // ── Swiper carousels ─────────────────────────────────────────────────────────
  private initSwipers(): void {
    // Featured Venues — 1 / 2 / 3 columns
    this.initSwiper('.featured-venues-slider', {
      loop: true,
      navigation: true,
      spaceBetween: 24,
      slidesPerView: 1,
      breakpoints: {
        768:  { slidesPerView: 2 },
        1000: { slidesPerView: 3 }
      }
    });

    // Featured Coaches — 1 / 2 / 4 columns
    this.initSwiper('.featured-coache-slider', {
      loop: true,
      navigation: true,
      spaceBetween: 24,
      slidesPerView: 1,
      breakpoints: {
        768:  { slidesPerView: 2 },
        1000: { slidesPerView: 4 }
      }
    });

    // Testimonial brand logos — autoplay, no nav, 1 / 3 / 5 columns
    this.initSwiper('.testimonial-brand-slider', {
      loop: true,
      autoplay: { delay: 2500, disableOnInteraction: false },
      spaceBetween: 60,
      slidesPerView: 1,
      breakpoints: {
        768:  { slidesPerView: 3 },
        1000: { slidesPerView: 5 }
      }
    });

    // Testimonials — 1 / 2 / 3 columns
    this.initSwiper('.testimonial-slide', {
      loop: true,
      navigation: true,
      spaceBetween: 24,
      slidesPerView: 1,
      breakpoints: {
        768:  { slidesPerView: 2 },
        1000: { slidesPerView: 3 }
      }
    });

    // Courts Near You — 1 / 2 / 3 columns
    this.initSwiper('.court-near-slider', {
      loop: true,
      navigation: true,
      spaceBetween: 24,
      slidesPerView: 1,
      breakpoints: {
        768:  { slidesPerView: 2 },
        1000: { slidesPerView: 3 }
      }
    });

    // Latest News — 1 / 2 / 3 columns
    this.initSwiper('.latest-news-slider', {
      loop: true,
      navigation: true,
      spaceBetween: 24,
      slidesPerView: 1,
      breakpoints: {
        768:  { slidesPerView: 2 },
        1000: { slidesPerView: 3 }
      }
    });
  }

  private initSwiper(selector: string, config: any): void {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    const finalConfig = { ...config };
    if (finalConfig.navigation === true) {
      finalConfig.navigation = {
        nextEl: el.querySelector<HTMLElement>('.swiper-button-next'),
        prevEl: el.querySelector<HTMLElement>('.swiper-button-prev'),
      };
    }
    new Swiper(el, finalConfig);
  }

  // ── CounterUp replacement (IntersectionObserver + rAF) ───────────────────────
  private initCounters(): void {
    const counters = document.querySelectorAll<HTMLElement>('.counter-up');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseInt(el.textContent ?? '0', 10);
        observer.unobserve(el);
        this.animateCount(el, target);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  private animateCount(el: HTMLElement, target: number): void {
    const duration = 1500;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      el.textContent = String(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = String(target);
      }
    };
    requestAnimationFrame(step);
  }
}
