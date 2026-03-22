import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

interface DockItem {
  readonly icon: string;
  readonly label: string;
  readonly route: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly dockItems: readonly DockItem[] = [
    {
      icon: 'space_dashboard',
      label: 'Mission',
      route: '/dashboard',
      exact: true,
    },
    {
      icon: 'menu_book',
      label: '课程',
      route: '/courses',
    },
    {
      icon: 'groups',
      label: '学生',
      route: '/students',
    },
    {
      icon: 'analytics',
      label: '洞察',
      route: '/analytics',
      exact: true,
    },
    {
      icon: 'calendar_month',
      label: '日程',
      route: '/schedule',
      exact: true,
    },
    {
      icon: 'settings',
      label: '设置',
      route: '/settings',
      exact: true,
    },
  ];
}
