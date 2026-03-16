import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './page-hero.component.html',
  styleUrl: './page-hero.component.scss',
})
export class PageHeroComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly badge = input('Aurora System');
  readonly icon = input('auto_awesome');
}
