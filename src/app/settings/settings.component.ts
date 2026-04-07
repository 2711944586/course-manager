import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { ThemeService } from '../core/services/theme.service';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { ActivityLogService } from '../core/services/activity-log.service';
import { ToastService } from '../core/services/toast.service';
import { exportBackup } from '../core/utils/data-backup.util';
import { AiInsightService } from '../core/services/ai-insight.service';
import { AiProviderStubConfig } from '../core/models/insight.model';
import { safeStorageGetItem, safeStorageKeys, safeStorageRemoveItem } from '../core/utils/safe-storage.util';
import { NotificationStoreService } from '../core/services/notification-store.service';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule, MatRippleModule, PageHeroComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly message = signal('');
  readonly messageType = signal<'success' | 'error'>('success');
  readonly aiDraft = signal<AiProviderStubConfig>({ endpoint: '', model: '', apiKey: '' });

  readonly currentTheme = computed(() => this.themeService.theme());
  readonly aiStatus = computed(() => this.aiInsights.status());
  readonly aiStatusLabel = computed(() => this.aiInsights.statusLabel());
  readonly aiConfig = computed(() => this.aiInsights.config());

  readonly storageStats = computed(() => {
    const courses = this.courseStore.courses().length;
    const students = this.studentStore.students().length;
    const teachers = this.teacherStore.teachers().length;
    const enrollments = this.enrollmentStore.enrollments().length;
    const activities = this.activityLog.entries().length;

    let totalBytes = 0;
    for (const key of safeStorageKeys('aurora.')) {
      totalBytes += (safeStorageGetItem(key) ?? '').length * 2;
    }

    return { courses, students, teachers, enrollments, activities, totalBytes };
  });

  readonly formattedSize = computed(() => {
    const bytes = this.storageStats().totalBytes;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  });

  constructor(
    private readonly themeService: ThemeService,
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly teacherStore: TeacherStoreService,
    private readonly enrollmentStore: EnrollmentStoreService,
    private readonly activityLog: ActivityLogService,
    private readonly toast: ToastService,
    private readonly aiInsights: AiInsightService,
    private readonly notificationStore: NotificationStoreService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    this.aiDraft.set(this.aiInsights.config());
  }

  setTheme(theme: 'light' | 'dark'): void {
    if (this.currentTheme() !== theme) {
      this.themeService.toggleTheme();
    }
  }

  exportAllData(): void {
    exportBackup({
      courses: this.courseStore.courses(),
      students: this.studentStore.students(),
      teachers: this.teacherStore.teachers(),
      enrollments: this.enrollmentStore.enrollments(),
      notifications: this.notificationStore.notifications(),
      activities: this.activityLog.entries(),
    });
    this.showMessage('数据已导出为 JSON 文件', 'success');
    this.toast.success('导出成功', '数据备份文件已下载到本地');
    this.activityLog.log('export', 'system', '系统', '导出全部数据备份');
  }

  async resetAllData(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '重置全部数据',
      message: '该操作将清除课程、学生、教师、选课、通知和活动日志数据，且不可撤销。',
      confirmText: '确认重置',
      tone: 'danger',
    });
    if (!confirmed) return;

    const resetKeys = [
      'aurora.course-manager.courses',
      'aurora.course-manager.students',
      'aurora.course-manager.teachers',
      'aurora.course-manager.enrollments',
      'aurora.course-manager.activity-log',
      'aurora.course-manager.notifications',
      'aurora.course-manager.recent-workspace',
      'aurora.course-manager.ai-provider-stub',
    ] as const;

    for (const key of resetKeys) {
      safeStorageRemoveItem(key);
    }

    this.showMessage('数据已重置，请刷新页面以加载初始数据', 'success');
    this.toast.info('数据已重置', '页面将在 1.5 秒后自动刷新');
    setTimeout(() => window.location.reload(), 1500);
  }

  async clearActivityLog(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '清除活动日志',
      message: '清除后将无法再回看最近操作记录。',
      confirmText: '确认清除',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.activityLog.clearAll();
    this.showMessage('活动日志已清除', 'success');
    this.toast.success('日志已清除', '全部活动日志已清空');
  }

  updateAiField(field: keyof AiProviderStubConfig, value: string): void {
    this.aiDraft.update(current => ({ ...current, [field]: value }));
  }

  saveAiStub(): void {
    this.aiInsights.saveStubConfig(this.aiDraft());
    this.showMessage('分析服务配置已保存', 'success');
    this.toast.info('分析服务配置已更新', '已保存服务地址、服务标识与访问凭证信息');
  }

  resetAiStub(): void {
    this.aiInsights.resetStubConfig();
    this.aiDraft.set(this.aiInsights.config());
    this.showMessage('分析服务配置已重置', 'success');
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}
