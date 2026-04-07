import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { ActivityLogService, ActivityEntry } from '../core/services/activity-log.service';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatButtonModule, MatRippleModule, PageHeroComponent],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss',
})
export class ActivityLogComponent {
  readonly activeFilter = signal<ActivityEntry['entity'] | 'all'>('all');

  readonly stats = computed(() => this.activityLog.stats());

  readonly filteredEntries = computed(() => {
    const filter = this.activeFilter();
    const entries = this.activityLog.entries();
    if (filter === 'all') return entries;
    return entries.filter(e => e.entity === filter);
  });

  readonly filterOptions: { value: ActivityEntry['entity'] | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: 'list' },
    { value: 'course', label: '课程', icon: 'menu_book' },
    { value: 'student', label: '学生', icon: 'groups' },
    { value: 'teacher', label: '教师', icon: 'school' },
    { value: 'enrollment', label: '选课', icon: 'fact_check' },
    { value: 'system', label: '系统', icon: 'settings' },
  ];

  constructor(
    private readonly activityLog: ActivityLogService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {}

  setFilter(value: ActivityEntry['entity'] | 'all'): void {
    this.activeFilter.set(value);
  }

  getActionIcon(action: ActivityEntry['action']): string {
    const map: Record<ActivityEntry['action'], string> = {
      create: 'add_circle',
      update: 'edit',
      delete: 'delete',
      import: 'upload',
      export: 'download',
    };
    return map[action];
  }

  getActionLabel(action: ActivityEntry['action']): string {
    const map: Record<ActivityEntry['action'], string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      import: '导入',
      export: '导出',
    };
    return map[action];
  }

  getEntityLabel(entity: ActivityEntry['entity']): string {
    const map: Record<ActivityEntry['entity'], string> = {
      course: '课程',
      student: '学生',
      teacher: '教师',
      enrollment: '选课',
      system: '系统',
    };
    return map[entity];
  }

  async clearLog(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '清空活动日志',
      message: '清空后将无法恢复操作审计记录。',
      confirmText: '确认清空',
      tone: 'danger',
    });

    if (confirmed) {
      this.activityLog.clearAll();
    }
  }
}
