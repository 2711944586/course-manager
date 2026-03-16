import { Component, computed, signal } from '@angular/core';
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
import { exportBackup } from '../core/utils/data-backup.util';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatRippleModule, PageHeroComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly message = signal('');
  readonly messageType = signal<'success' | 'error'>('success');

  readonly currentTheme = computed(() => this.themeService.theme());

  readonly storageStats = computed(() => {
    const courses = this.courseStore.courses().length;
    const students = this.studentStore.students().length;
    const teachers = this.teacherStore.teachers().length;
    const enrollments = this.enrollmentStore.enrollments().length;
    const activities = this.activityLog.entries().length;

    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('aurora.')) {
        totalBytes += (localStorage.getItem(key) ?? '').length * 2;
      }
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
  ) {}

  setTheme(theme: 'light' | 'dark'): void {
    if (this.currentTheme() !== theme) {
      this.themeService.toggleTheme();
    }
  }

  exportAllData(): void {
    exportBackup(this.courseStore.courses(), this.studentStore.students());
    this.showMessage('数据已导出为 JSON 文件', 'success');
    this.activityLog.log('export', 'system', '系统', '导出全部数据备份');
  }

  resetAllData(): void {
    if (!confirm('确定要重置所有数据？此操作将清除课程、学生、教师、选课及活动日志数据，不可撤销。')) return;

    localStorage.removeItem('aurora.course-manager.courses');
    localStorage.removeItem('aurora.course-manager.students');
    localStorage.removeItem('aurora.course-manager.teachers');
    localStorage.removeItem('aurora.course-manager.enrollments');
    localStorage.removeItem('aurora.course-manager.activity-log');
    localStorage.removeItem('aurora.course-manager.notifications');

    this.showMessage('数据已重置，请刷新页面以加载种子数据', 'success');
    setTimeout(() => window.location.reload(), 1500);
  }

  clearActivityLog(): void {
    if (!confirm('确定清除全部活动日志？')) return;
    this.activityLog.clearAll();
    this.showMessage('活动日志已清除', 'success');
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}
