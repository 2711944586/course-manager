import { Component, signal } from '@angular/core';
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
  readonly isExpanded = signal(true);

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
      icon: 'school',
      label: '教师',
      route: '/teachers',
    },
    {
      icon: 'how_to_reg',
      label: '选课',
      route: '/enrollments',
      exact: true,
    },
    {
      icon: 'analytics',
      label: '洞察',
      route: '/analytics',
      exact: true,
    },
    {
      icon: 'assessment',
      label: '报表',
      route: '/reports',
      exact: true,
    },
    {
      icon: 'calendar_month',
      label: '日程',
      route: '/schedule',
      exact: true,
    },
    {
      icon: 'history',
      label: '日志',
      route: '/activity-log',
      exact: true,
    },
    {
      icon: 'settings',
      label: '设置',
      route: '/settings',
      exact: true,
    },
  ];

  toggleDock(): void {
    this.isExpanded.update((expanded) => !expanded);
  }
}
