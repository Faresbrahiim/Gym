import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  readonly primaryItems: DashboardMenuItem[] = [
    { label: 'Profile', route: '/profile', icon: 'assets/img/icons/profile-icon.svg', exact: true },
    { label: 'Security', route: '/profile/security', icon: 'assets/img/icons/sessions.svg' },
    { label: 'Membership', route: '/membership', icon: 'assets/img/icons/wallet-icon.svg', exact: true },
    { label: 'History', route: '/membership/history', icon: 'assets/img/icons/booking-icon.svg', exact: true },
    { label: 'Orders', route: '/orders', icon: 'assets/img/icons/booking-icon.svg', exact: false },
    { label: 'Payments', route: '/payments', icon: 'assets/img/icons/invoice-icon.svg', exact: false }
  ];

  readonly utilityItems: DashboardMenuItem[] = [
    { label: 'Dashboard', route: '/home', icon: 'assets/img/icons/dashboard-icon.svg', exact: true },
    { label: 'Chat', route: '/chat', icon: 'assets/img/icons/chat-icon.svg', tone: 'accent' },
    { label: 'Bookings', icon: 'assets/img/icons/booking-icon.svg', disabled: true, note: 'Soon' }
  ];
}
