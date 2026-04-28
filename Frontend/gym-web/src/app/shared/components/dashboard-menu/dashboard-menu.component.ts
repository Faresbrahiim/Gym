import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TokenService } from '../../../core/auth/token.service';

interface DashboardMenuItem {
  label: string;
  route?: string;
  icon: string;
  exact?: boolean;
  tone?: 'default' | 'accent';
  disabled?: boolean;
  note?: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard-menu.component.html',
  styleUrl: './dashboard-menu.component.css'
})
export class DashboardMenuComponent {
  private readonly tokenService = inject(TokenService);

  private readonly allPrimaryItems: DashboardMenuItem[] = [
    { label: 'Profile', route: '/profile', icon: 'assets/img/icons/profile-icon.svg', exact: true },
    { label: 'Security', route: '/profile/security', icon: 'assets/img/icons/sessions.svg' },
    { label: 'My Bookings', route: '/bookings/my', icon: 'assets/img/icons/booking-icon.svg', exact: false },
    { label: 'Membership', route: '/membership', icon: 'assets/img/icons/wallet-icon.svg', exact: true },
    { label: 'History', route: '/membership/history', icon: 'assets/img/icons/booking-icon.svg', exact: true },
    { label: 'Orders', route: '/orders', icon: 'assets/img/icons/booking-icon.svg', exact: false },
    { label: 'Payments', route: '/payments', icon: 'assets/img/icons/invoice-icon.svg', exact: false }
  ];

  readonly utilityItems: DashboardMenuItem[] = [
    { label: 'Dashboard', route: '/home', icon: 'assets/img/icons/dashboard-icon.svg', exact: true },
    { label: 'Chat', route: '/chat', icon: 'assets/img/icons/chat-icon.svg', tone: 'accent' }
  ];

  get canAccessMembershipArea(): boolean {
    return this.tokenService.getRole() === 'MEMBER';
  }

  get isCoach(): boolean {
    return this.tokenService.getRole() === 'COACH';
  }

  get primaryItems(): DashboardMenuItem[] {
    if (this.canAccessMembershipArea) {
      return [...this.allPrimaryItems];
    }

    const items = [
      ...this.allPrimaryItems.filter(item =>
        item.route !== '/bookings/my'
        && item.route !== '/membership'
        && item.route !== '/membership/history'
        && item.route !== '/payments'
      )
    ];

    if (this.isCoach) {
      return [
        ...items,
        { label: 'Coach Sessions', route: '/bookings/coach', icon: 'assets/img/icons/booking-icon.svg', exact: false }
      ];
    }

    return [
      ...items.filter(item =>
        item.route !== '/membership'
        && item.route !== '/membership/history'
        && item.route !== '/payments'
      )
    ];
  }

  get accountDeckDescription(): string {
    if (this.canAccessMembershipArea) {
      return 'Manage your profile, bookings, membership, orders, payments, and activity from one place.';
    }

    if (this.isCoach) {
      return 'Manage your profile, coach sessions, orders, and activity from one place.';
    }

    return 'Manage your profile, orders, and activity from one place.';
  }
}
