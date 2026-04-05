import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {}
