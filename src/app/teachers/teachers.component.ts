import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import {
  TEACHER_STATUS_OPTIONS,
  Teacher,
  TeacherStatus,
} from '../core/models/teacher.model';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatRippleModule, PageHeroComponent, DatePipe],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.scss',
})
export class TeachersComponent {
  private readonly store = inject(TeacherStoreService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly searchKeyword = signal('');
  readonly selectedDepartment = signal<'all' | string>('all');
  readonly selectedStatus = signal<'all' | TeacherStatus>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly teachers = this.store.teachers;
  readonly statusOptions = TEACHER_STATUS_OPTIONS;

  readonly departmentOptions = computed(() =>
    [...new Set(this.teachers().map(teacher => teacher.department))].sort((first, second) =>
      first.localeCompare(second, 'zh-CN'),
    ),
  );

  readonly teacherStats = computed(() => {
    const teachers = this.teachers();
    const activeTeachers = teachers.filter(teacher => teacher.status === 'active').length;
    const overloadedTeachers = teachers.filter(teacher => teacher.currentWeeklyHours > teacher.maxWeeklyHours).length;
    const pendingTeachers = teachers.filter(teacher => teacher.status === 'pending').length;
    const averageLoad =
      teachers.length > 0
        ? Math.round(
            teachers.reduce((total, teacher) => total + this.getLoadPercent(teacher), 0) / teachers.length,
          )
        : 0;

    return {
      total: teachers.length,
      active: activeTeachers,
      overloaded: overloadedTeachers,
      pending: pendingTeachers,
      averageLoad,
    };
  });

  readonly filteredTeachers = computed(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    const department = this.selectedDepartment();
    const status = this.selectedStatus();

    return this.teachers()
      .filter(teacher => {
        const keywordMatched =
          keyword.length === 0 ||
          [
            teacher.name,
            teacher.employeeNo,
            teacher.department,
            teacher.office,
            teacher.email,
            ...teacher.expertise,
          ].some(field => field.toLowerCase().includes(keyword));
        const departmentMatched = department === 'all' || teacher.department === department;
        const statusMatched = status === 'all' || teacher.status === status;

        return keywordMatched && departmentMatched && statusMatched;
      })
      .sort((firstTeacher, secondTeacher) => {
        const loadDiff = this.getLoadPercent(secondTeacher) - this.getLoadPercent(firstTeacher);
        if (loadDiff !== 0) {
          return loadDiff;
        }

        return new Date(secondTeacher.updatedAt).getTime() - new Date(firstTeacher.updatedAt).getTime();
      });
  });

  readonly spotlightTeachers = computed(() =>
    [...this.teachers()]
      .sort((firstTeacher, secondTeacher) => this.getLoadPercent(secondTeacher) - this.getLoadPercent(firstTeacher))
      .slice(0, 4),
  );

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTeachers().length / this.pageSize())));

  readonly pagedTeachers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredTeachers().slice(start, start + this.pageSize());
  });

  goToPage(page: number): void {
    const max = this.totalPages() - 1;
    this.pageIndex.set(Math.max(0, Math.min(page, max)));
  }

  async deleteTeacher(teacher: Teacher): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '删除教师档案',
      message: `确认删除教师 ${teacher.name}（${teacher.employeeNo}）？该操作不可撤销。`,
      confirmText: '确认删除',
      tone: 'danger',
    });

    if (confirmed) {
      this.store.removeTeacher(teacher.id);
    }
  }

  getLoadPercent(teacher: Teacher): number {
    if (teacher.maxWeeklyHours <= 0) {
      return 0;
    }

    return Math.min(160, Math.round((teacher.currentWeeklyHours / teacher.maxWeeklyHours) * 100));
  }

  getStatusLabel(status: TeacherStatus): string {
    return this.statusOptions.find(option => option.value === status)?.label ?? status;
  }

  getLoadLabel(teacher: Teacher): string {
    if (teacher.currentWeeklyHours > teacher.maxWeeklyHours) {
      return '超载';
    }

    if (this.getLoadPercent(teacher) >= 85) {
      return '高负荷';
    }

    return '平稳';
  }
}
