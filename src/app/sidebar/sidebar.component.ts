import { Component, signal, ElementRef, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { ToastService } from '../core/services/toast.service';
import { exportBackup, readBackupFile } from '../core/utils/data-backup.util';

interface NavItem {
  readonly icon: string;
  readonly label: string;
  readonly route: string;
  readonly exact?: boolean;
  readonly description: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly collapsed = signal(false);
  readonly restoreMessage = signal('');

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly navItems: readonly NavItem[] = [
    {
      icon: 'space_dashboard',
      label: '仪表盘',
      route: '/dashboard',
      exact: true,
      description: '查看系统总览与待办事项',
    },
    {
      icon: 'school',
      label: '教师管理',
      route: '/teachers',
      description: '管理全校教研人员信息',
    },
    {
      icon: 'menu_book',
      label: '课程管理',
      route: '/courses',
      description: '维护课程、筛选状态与查看详情',
    },
    {
      icon: 'groups',
      label: '学生管理',
      route: '/students',
      description: '维护学生资料与批量演示数据',
    },
    {
      icon: 'fact_check',
      label: '选课与成绩',
      route: '/enrollments',
      description: '管理学生选课及学习成绩',
    },
    {
      icon: 'calendar_month',
      label: '教务日程',
      route: '/schedule',
      exact: true,
      description: '查看周课表与教学提醒',
    },
    {
      icon: 'insights',
      label: '数据报表',
      route: '/reports',
      exact: true,
      description: '查看课程与学生分析数据',
    },
    {
      icon: 'analytics',
      label: '数据分析',
      route: '/analytics',
      exact: true,
      description: '全维度教学数据洞察与可视化',
    },
    {
      icon: 'history',
      label: '活动日志',
      route: '/activity-log',
      exact: true,
      description: '系统操作记录与审计追踪',
    },
    {
      icon: 'settings',
      label: '系统设置',
      route: '/settings',
      exact: true,
      description: '数据管理与系统配置',
    },
  ];

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly toast: ToastService,
  ) {}

  exportData(): void {
    exportBackup(this.courseStore.courses(), this.studentStore.students());
    this.toast.success('导出成功', '备份文件已下载到本地');
  }

  triggerImport(): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const backup = await readBackupFile(file);
      const courseCount = this.courseStore.importAll(backup.courses);
      const studentCount = this.studentStore.importAll(backup.students);
      this.restoreMessage.set(`已恢复 ${courseCount} 门课程、${studentCount} 名学生`);
      this.toast.success('数据恢复成功', `已恢复 ${courseCount} 门课程、${studentCount} 名学生`);
      setTimeout(() => this.restoreMessage.set(''), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '恢复失败';
      this.restoreMessage.set(msg);
      this.toast.error('恢复失败', msg);
      setTimeout(() => this.restoreMessage.set(''), 3000);
    }

    input.value = '';
  }
}
