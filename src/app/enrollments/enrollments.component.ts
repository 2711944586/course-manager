import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import {
  ENROLLMENT_PRIORITY_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
  ENROLLMENT_WORKFLOW_OPTIONS,
  Enrollment,
  EnrollmentPriority,
  EnrollmentStatus,
  EnrollmentWorkflowStatus,
} from '../core/models/enrollment.model';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatRippleModule, PageHeroComponent, DatePipe],
  templateUrl: './enrollments.component.html',
  styleUrl: './enrollments.component.scss',
})
export class EnrollmentsComponent {
  private readonly store = inject(EnrollmentStoreService);
  private readonly courseStore = inject(CourseStoreService);
  private readonly studentStore = inject(StudentStoreService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly searchKeyword = signal('');
  readonly selectedStatus = signal<'all' | EnrollmentStatus>('all');
  readonly selectedWorkflowStatus = signal<'all' | EnrollmentWorkflowStatus>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly statusOptions = ENROLLMENT_STATUS_OPTIONS;
  readonly workflowOptions = ENROLLMENT_WORKFLOW_OPTIONS;
  readonly priorityOptions = ENROLLMENT_PRIORITY_OPTIONS;

  readonly enrollments = this.store.enrollments;

  readonly viewModels = computed(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    const status = this.selectedStatus();
    const workflowStatus = this.selectedWorkflowStatus();

    return this.enrollments()
      .map(enrollment => {
        const course = this.courseStore.getCourseById(enrollment.courseId);
        const student = this.studentStore.getStudentById(enrollment.studentId);

        return {
          ...enrollment,
          courseName: course?.name || '未知课程',
          courseInstructor: course?.instructor || '',
          studentName: student?.name || '未知学生',
          studentNo: student?.studentNo || '',
        };
      })
      .filter(enrollment => {
        const keywordMatched =
          keyword.length === 0 ||
          [
            enrollment.courseName,
            enrollment.studentName,
            enrollment.studentNo,
            enrollment.operator,
            ...enrollment.riskFlags,
          ].some(field => field.toLowerCase().includes(keyword));
        const statusMatched = status === 'all' || enrollment.status === status;
        const workflowMatched = workflowStatus === 'all' || enrollment.workflowStatus === workflowStatus;

        return keywordMatched && statusMatched && workflowMatched;
      })
      .sort((first, second) => {
        const firstRank = this.getPriorityRank(first.priority);
        const secondRank = this.getPriorityRank(second.priority);
        if (firstRank !== secondRank) {
          return secondRank - firstRank;
        }

        return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
      });
  });

  readonly controlStats = computed(() => {
    const enrollments = this.enrollments();
    return {
      total: enrollments.length,
      pendingReview: enrollments.filter(item => item.workflowStatus === 'pending-review').length,
      overdue: enrollments.filter(item => this.isSlaOverdue(item)).length,
      highRisk: enrollments.filter(item => item.riskFlags.length > 0).length,
      completed: enrollments.filter(item => item.status === 'completed').length,
    };
  });

  readonly queuePreview = computed(() =>
    this.viewModels()
      .filter(item => item.workflowStatus === 'pending-review' || item.priority !== 'routine')
      .slice(0, 5),
  );

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.viewModels().length / this.pageSize())));

  readonly pagedViewModels = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.viewModels().slice(start, start + this.pageSize());
  });

  goToPage(page: number): void {
    const max = this.totalPages() - 1;
    this.pageIndex.set(Math.max(0, Math.min(page, max)));
  }

  async deleteEnrollment(enrollment: { id: number; studentName?: string; courseName?: string }): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '删除选课记录',
      message: `确认删除该选课记录？`,
      confirmText: '确认删除',
      tone: 'danger',
    });

    if (confirmed) {
      this.store.removeEnrollment(enrollment.id);
    }
  }

  getStatusLabel(status: EnrollmentStatus): string {
    return this.statusOptions.find(option => option.value === status)?.label ?? status;
  }

  getWorkflowLabel(status: EnrollmentWorkflowStatus): string {
    return this.workflowOptions.find(option => option.value === status)?.label ?? status;
  }

  getPriorityLabel(priority: EnrollmentPriority): string {
    return this.priorityOptions.find(option => option.value === priority)?.label ?? priority;
  }

  isSlaOverdue(enrollment: Pick<Enrollment, 'slaDeadline' | 'workflowStatus'>): boolean {
    return enrollment.workflowStatus === 'pending-review' && new Date(enrollment.slaDeadline).getTime() < Date.now();
  }

  private getPriorityRank(priority: EnrollmentPriority): number {
    if (priority === 'urgent') {
      return 3;
    }
    if (priority === 'attention') {
      return 2;
    }
    return 1;
  }
}
