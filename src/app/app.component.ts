import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, ElementRef, HostListener, signal, untracked, ViewChild } from '@angular/core';
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
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { scoreToGrade } from './core/utils/score-grade.util';
import { exportBackup, readBackupFile } from './core/utils/data-backup.util';
import { ToastService } from './core/services/toast.service';
import { ActivityLogService } from './core/services/activity-log.service';
import { RecentWorkspaceService } from './core/services/recent-workspace.service';
import { TeacherStoreService } from './core/services/teacher-store.service';
import { EnrollmentStoreService } from './core/services/enrollment-store.service';

interface SearchResult {
  type: 'course' | 'student';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

interface CurrentRouteMeta {
  readonly title: string;
  readonly icon: string;
  readonly route: string;
}

interface QuickCommand {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly tone: 'primary' | 'secondary';
  readonly route?: string;
  readonly action?: 'export' | 'import' | 'search';
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
  @ViewChild('backupFileInput') backupFileInputRef?: ElementRef<HTMLInputElement>;

  private readonly currentRouteMetaSignal = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveRouteMeta()),
    ),
    { initialValue: this.resolveRouteMeta() },
  );

  readonly pageTitle = computed(() => this.currentRouteMetaSignal().title);
  readonly pageIcon = computed(() => this.currentRouteMetaSignal().icon);
  readonly isDarkTheme = computed(() => this.themeService.theme() === 'dark');
  readonly workspaceItems = computed(() => this.recentWorkspace.items());
  readonly notifications = computed(() => this.notificationStore.notifications());
  readonly unreadCount = computed(() => this.notificationStore.unreadCount());
  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date()),
  );

  readonly quickCommands: readonly QuickCommand[] = [
    {
      label: '新建课程',
      description: '立即进入课程创建流程',
      icon: 'add_circle',
      tone: 'primary',
      route: '/courses/create',
    },
    {
      label: '新建学生',
      description: '快速打开学生录入页',
      icon: 'person_add',
      tone: 'primary',
      route: '/students/create',
    },
    {
      label: '查看报表',
      description: '打开数据报表中心',
      icon: 'insights',
      tone: 'secondary',
      route: '/reports',
    },
    {
      label: '教师管理',
      description: '进入教师团队工作台',
      icon: 'school',
      tone: 'secondary',
      route: '/teachers',
    },
    {
      label: '选课与成绩',
      description: '查看选课记录与成绩录入',
      icon: 'fact_check',
      tone: 'secondary',
      route: '/enrollments',
    },
    {
      label: '活动日志',
      description: '审计最近操作记录',
      icon: 'history',
      tone: 'secondary',
      route: '/activity-log',
    },
    {
      label: '导出备份',
      description: '下载完整工作区 JSON 备份',
      icon: 'download',
      tone: 'secondary',
      action: 'export',
    },
    {
      label: '恢复备份',
      description: '恢复课程、学生、教师与选课数据',
      icon: 'upload',
      tone: 'secondary',
      action: 'import',
    },
    {
      label: '全局搜索',
      description: '聚焦指挥条搜索，快速跳转到课程和学生',
      icon: 'search',
      tone: 'secondary',
      action: 'search',
    },
  ];

  readonly searchQuery = signal('');
  readonly showSearchResults = signal(false);
  readonly showNotifications = signal(false);
  readonly showQuickCommands = signal(false);

  readonly searchResults = computed<SearchResult[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (query.length < 1) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const course of this.courseStore.courses()) {
      if (course.name.toLowerCase().includes(query) || course.instructor.toLowerCase().includes(query)) {
        results.push({
          type: 'course',
          id: course.id,
          title: course.name,
          subtitle: `${course.instructor} · ${course.status === 'active' ? '进行中' : course.status === 'completed' ? '已结课' : '未开始'}`,
          icon: course.icon || 'menu_book',
          route: `/courses/detail/${course.id}`,
        });
      }
    }

    for (const student of this.studentStore.students()) {
      if (student.name.toLowerCase().includes(query) || student.studentNo.includes(query)) {
        results.push({
          type: 'student',
          id: student.id,
          title: student.name,
          subtitle: `${student.studentNo} · ${student.gender === 'male' ? '男' : '女'} · ${scoreToGrade(student.score)}`,
          icon: 'person',
          route: `/students/detail/${student.id}`,
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
    private readonly teacherStore: TeacherStoreService,
    private readonly enrollmentStore: EnrollmentStoreService,
    private readonly notificationStore: NotificationStoreService,
    private readonly toast: ToastService,
    private readonly activityLog: ActivityLogService,
    private readonly recentWorkspace: RecentWorkspaceService,
  ) {
    effect(
      () => {
        const routeMeta = this.currentRouteMetaSignal();
        untracked(() => {
          this.recentWorkspace.track({
            label: routeMeta.title,
            route: routeMeta.route,
            icon: routeMeta.icon,
            subtitle: this.resolveRouteSubtitle(routeMeta.route),
          });
        });
      },
      { allowSignalWrites: true },
    );
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.showSearchResults.set(true);
      setTimeout(() => this.searchInputRef?.nativeElement.focus());
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
      event.preventDefault();
      this.showQuickCommands.update(current => !current);
    }

    if (event.key === 'Escape') {
      this.closeAllPanels();
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
    void this.router.navigateByUrl(result.route);
  }

  closeSearch(): void {
    this.showSearchResults.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(current => !current);
  }

  closeNotifications(): void {
    this.showNotifications.set(false);
  }

  toggleQuickCommands(): void {
    this.showQuickCommands.update(current => !current);
  }

  closeAllPanels(): void {
    this.closeSearch();
    this.closeNotifications();
    this.showQuickCommands.set(false);
  }

  markAllNotificationsRead(): void {
    this.notificationStore.markAllAsRead();
  }

  markNotificationRead(id: number): void {
    this.notificationStore.markAsRead(id);
  }

  executeQuickCommand(command: QuickCommand): void {
    if (command.route) {
      this.showQuickCommands.set(false);
      void this.router.navigateByUrl(command.route);
      return;
    }

    if (command.action === 'export') {
      this.exportProjectBackup();
      return;
    }

    if (command.action === 'import') {
      this.triggerImport();
      return;
    }

    if (command.action === 'search') {
      this.showSearchResults.set(true);
      setTimeout(() => this.searchInputRef?.nativeElement.focus());
    }
  }

  exportProjectBackup(): void {
    exportBackup({
      courses: this.courseStore.courses(),
      students: this.studentStore.students(),
      teachers: this.teacherStore.teachers(),
      enrollments: this.enrollmentStore.enrollments(),
      notifications: this.notificationStore.notifications(),
      activities: this.activityLog.entries(),
    });
    this.toast.success('备份已导出', '完整工作区 JSON 备份已下载到本地。');
    this.activityLog.log('export', 'system', '系统', '从指挥条导出完整工作区备份');
    this.showQuickCommands.set(false);
  }

  triggerImport(): void {
    this.backupFileInputRef?.nativeElement.click();
  }

  async onBackupSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const backup = await readBackupFile(file);
      const courseCount = this.courseStore.importAll(backup.courses);
      const studentCount = this.studentStore.importAll(backup.students);
      const teacherCount = this.teacherStore.importAll(backup.teachers);
      const enrollmentCount = this.enrollmentStore.importAll(backup.enrollments);
      const notificationCount = this.notificationStore.importAll(backup.notifications);
      const activityCount = this.activityLog.importAll(backup.activities);

      this.toast.success(
        '恢复成功',
        `已恢复 ${courseCount} 门课程、${studentCount} 名学生、${teacherCount} 名教师、${enrollmentCount} 条选课记录。`,
      );
      this.activityLog.log(
        'import',
        'system',
        '系统',
        `恢复备份：课程 ${courseCount} / 学生 ${studentCount} / 教师 ${teacherCount} / 选课 ${enrollmentCount} / 通知 ${notificationCount} / 日志 ${activityCount}`,
      );
      this.notificationStore.addNotification({
        type: 'success',
        title: '数据恢复完成',
        message: `已恢复 ${courseCount} 门课程、${studentCount} 名学生、${teacherCount} 名教师与 ${enrollmentCount} 条选课记录。`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '恢复失败';
      this.toast.error('恢复失败', message);
    } finally {
      input.value = '';
      this.showQuickCommands.set(false);
    }
  }

  private resolveRouteMeta(): CurrentRouteMeta {
    let route = this.router.routerState.snapshot.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    return {
      title: route.data['title'] ?? this.title,
      icon: route.data['icon'] ?? 'space_dashboard',
      route: this.router.url.split('?')[0] || '/dashboard',
    };
  }

  private resolveRouteSubtitle(route: string): string {
    if (route.startsWith('/courses')) {
      return '课程工作台';
    }
    if (route.startsWith('/students')) {
      return '学生工作台';
    }
    if (route.startsWith('/analytics')) {
      return '智能洞察';
    }
    if (route.startsWith('/reports')) {
      return '分析报表';
    }
    if (route.startsWith('/schedule')) {
      return '教务日程';
    }
    if (route.startsWith('/teachers')) {
      return '教师团队';
    }
    if (route.startsWith('/enrollments')) {
      return '成绩与选课';
    }
    if (route.startsWith('/activity-log')) {
      return '活动日志';
    }
    if (route.startsWith('/settings')) {
      return '系统配置';
    }

    return 'Mission Control';
  }
}
