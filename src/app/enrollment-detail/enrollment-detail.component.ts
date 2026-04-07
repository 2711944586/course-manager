import { Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';
import {
  ENROLLMENT_STATUS_OPTIONS,
  ENROLLMENT_WORKFLOW_OPTIONS,
  ENROLLMENT_PRIORITY_OPTIONS,
} from '../core/models/enrollment.model';

@Component({
  selector: 'app-enrollment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatRippleModule, PageHeroComponent, DatePipe],
  templateUrl: './enrollment-detail.component.html',
  styleUrl: './enrollment-detail.component.scss',
})
export class EnrollmentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly enrollmentStore = inject(EnrollmentStoreService);
  private readonly courseStore = inject(CourseStoreService);
  private readonly studentStore = inject(StudentStoreService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  private readonly enrollmentId = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id')))),
    { initialValue: 0 },
  );

  readonly enrollment = computed(() => this.enrollmentStore.getEnrollmentById(this.enrollmentId()));

  readonly course = computed(() => {
    const e = this.enrollment();
    return e ? this.courseStore.getCourseById(e.courseId) : undefined;
  });

  readonly student = computed(() => {
    const e = this.enrollment();
    return e ? this.studentStore.getStudentById(e.studentId) : undefined;
  });

  readonly isSlaOverdue = computed(() => {
    const e = this.enrollment();
    if (!e) return false;
    return new Date(e.slaDeadline).getTime() < Date.now();
  });

  getStatusLabel(status: string): string {
    return ENROLLMENT_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status;
  }

  getWorkflowLabel(status: string): string {
    return ENROLLMENT_WORKFLOW_OPTIONS.find(o => o.value === status)?.label ?? status;
  }

  getPriorityLabel(priority: string): string {
    return ENROLLMENT_PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? priority;
  }

  async deleteEnrollment(): Promise<void> {
    const e = this.enrollment();
    if (!e) return;
    const courseName = this.course()?.name ?? '未知课程';
    const studentName = this.student()?.name ?? '未知学生';

    const confirmed = await this.confirmDialog.confirm({
      title: '删除选课记录',
      message: `确定要删除「${studentName} — ${courseName}」的选课记录吗？此操作不可撤销。`,
      confirmText: '确认删除',
      cancelText: '取消',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.enrollmentStore.removeEnrollment(e.id);
    this.router.navigate(['/enrollments']);
  }
}
