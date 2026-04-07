import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface EnrollmentViewModel extends Enrollment {
  readonly courseName: string;
  readonly courseInstructor: string;
  readonly studentName: string;
  readonly studentNo: string;
}

interface EnrollmentEditForm {
  studentId: number | null;
  courseId: number | null;
  score: number | string | null;
  status: EnrollmentStatus;
  workflowStatus: EnrollmentWorkflowStatus;
  priority: EnrollmentPriority;
  operator: string;
  decisionReason: string;
}

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule, PageHeroComponent, DatePipe],
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
  readonly creating = signal(false);
  readonly editingEnrollmentId = signal<number | null>(null);
  readonly enrollmentError = signal<string | null>(null);

  readonly statusOptions = ENROLLMENT_STATUS_OPTIONS;
  readonly workflowOptions = ENROLLMENT_WORKFLOW_OPTIONS;
  readonly priorityOptions = ENROLLMENT_PRIORITY_OPTIONS;

  readonly allCourses = this.courseStore.courses;
  readonly allStudents = this.studentStore.students;
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

  readonly showEditor = computed(() => this.creating() || this.editingEnrollmentId() !== null);

  editForm: EnrollmentEditForm = this.getEmptyForm();

  startCreate(): void {
    this.creating.set(true);
    this.editingEnrollmentId.set(null);
    this.enrollmentError.set(null);
    this.editForm = this.getEmptyForm();

    const students = this.allStudents();
    const courses = this.allCourses();

    if (students.length > 0) this.editForm.studentId = students[0].id;
    if (courses.length > 0) this.editForm.courseId = courses[0].id;
  }

  startEdit(enrollment: EnrollmentViewModel): void {
    this.creating.set(false);
    this.editingEnrollmentId.set(enrollment.id);
    this.enrollmentError.set(null);
    this.editForm = {
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      score: enrollment.score,
      status: enrollment.status,
      workflowStatus: enrollment.workflowStatus,
      priority: enrollment.priority,
      operator: enrollment.operator,
      decisionReason: enrollment.decisionReason,
    };
  }

  cancelEdit(): void {
    this.creating.set(false);
    this.editingEnrollmentId.set(null);
    this.enrollmentError.set(null);
    this.editForm = this.getEmptyForm();
  }

  saveEnrollment(): void {
    const id = this.editingEnrollmentId();

    try {
      const payload = {
        studentId: Number(this.editForm.studentId),
        courseId: Number(this.editForm.courseId),
        score:
          this.editForm.score === '' || this.editForm.score === null
            ? null
            : Number(this.editForm.score),
        status: this.editForm.status,
        workflowStatus: this.editForm.workflowStatus,
        priority: this.editForm.priority,
        operator: this.editForm.operator,
        decisionReason: this.editForm.decisionReason,
      };

      if (id) {
        this.store.updateEnrollment(id, payload);
      } else {
        this.store.createEnrollment(payload);
      }

      this.cancelEdit();
    } catch (error: unknown) {
      this.enrollmentError.set(error instanceof Error ? error.message : '保存失败');
    }
  }

  async deleteEnrollment(enrollment: EnrollmentViewModel): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '删除选课记录',
      message: `确认删除 ${enrollment.studentName} 的《${enrollment.courseName}》选课记录？`,
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

  private getEmptyForm(): EnrollmentEditForm {
    return {
      studentId: null,
      courseId: null,
      score: null,
      status: 'enrolled',
      workflowStatus: 'pending-review',
      priority: 'attention',
      operator: '教务运营台',
      decisionReason: '待院系完成容量复核',
    };
  }
}
