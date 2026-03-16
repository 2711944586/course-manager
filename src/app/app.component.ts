import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, ElementRef, HostListener, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ThemeService } from './core/services/theme.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { routeTransitionAnimation } from './shared/animations/route-transition.animation';
import { CourseStoreService } from './core/services/course-store.service';
import { StudentStoreService } from './core/services/student-store.service';
import { NotificationStoreService } from './core/services/notification-store.service';
import { scoreToGrade } from './core/utils/score-grade.util';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

interface SearchResult {
  type: 'course' | 'student';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, MatButtonModule, MatIconModule, FormsModule, DatePipe, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeTransitionAnimation],
})
export class AppComponent {
  readonly title = 'Aurora 课程管理';

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private readonly currentRouteTitle = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveRouteTitle()),
    ),
    { initialValue: this.resolveRouteTitle() },
  );

  readonly pageTitle = computed(() => this.currentRouteTitle());
  readonly isDarkTheme = computed(() => this.themeService.theme() === 'dark');

  searchQuery = signal('');
  showSearchResults = signal(false);
  showNotifications = signal(false);

  readonly notifications = computed(() => this.notificationStore.notifications());
  readonly unreadCount = computed(() => this.notificationStore.unreadCount());

  readonly searchResults = computed<SearchResult[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (q.length < 1) return [];

    const results: SearchResult[] = [];
    const courses = this.courseStore.courses();
    const students = this.studentStore.students();

    for (const c of courses) {
      if (c.name.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)) {
        results.push({
          type: 'course',
          id: c.id,
          title: c.name,
          subtitle: `${c.instructor} · ${c.status === 'active' ? '进行中' : c.status === 'completed' ? '已结课' : '未开始'}`,
          icon: c.icon || 'menu_book',
          route: `/courses/detail/${c.id}`,
        });
      }
    }

    for (const s of students) {
      if (s.name.toLowerCase().includes(q) || s.studentNo.includes(q)) {
        results.push({
          type: 'student',
          id: s.id,
          title: s.name,
          subtitle: `${s.studentNo} · ${s.gender === 'male' ? '男' : '女'} · ${scoreToGrade(s.score)}`,
          icon: 'person',
          route: `/students/detail/${s.id}`,
        });
      }
    }

    return results.slice(0, 8);
  });

  constructor(
    private readonly router: Router,
    private readonly themeService: ThemeService,
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly notificationStore: NotificationStoreService,
  ) {}

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Ctrl+K / Cmd+K → 聚焦搜索框
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.showSearchResults.set(true);
      setTimeout(() => this.searchInputRef?.nativeElement.focus());
    }

    // Esc → 关闭搜索
    if (event.key === 'Escape') {
      if (this.showSearchResults()) this.closeSearch();
      if (this.showNotifications()) this.showNotifications.set(false);
    }
  }

  prepareRoute(outlet: RouterOutlet): string {
    return outlet.activatedRouteData['animation'] ?? 'root';
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  navigateResult(result: SearchResult): void {
    this.searchQuery.set('');
    this.showSearchResults.set(false);
    this.router.navigateByUrl(result.route);
  }

  closeSearch(): void {
    this.showSearchResults.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
  }

  closeNotifications(): void {
    this.showNotifications.set(false);
  }

  markAllNotificationsRead(): void {
    this.notificationStore.markAllAsRead();
  }

  markNotificationRead(id: number): void {
    this.notificationStore.markAsRead(id);
  }

  private resolveRouteTitle(): string {
    let route = this.router.routerState.snapshot.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    return route.data['title'] ?? this.title;
  }
}
