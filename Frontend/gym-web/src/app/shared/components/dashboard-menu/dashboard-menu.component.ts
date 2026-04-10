import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dashboard-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard-menu.component.html'
})
export class DashboardMenuComponent {}
