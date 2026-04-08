import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import {
  ENROLLMENT_STATUS_OPTIONS,
  ENROLLMENT_WORKFLOW_OPTIONS,
  ENROLLMENT_PRIORITY_OPTIONS,
  EnrollmentStatus,
  EnrollmentWorkflowStatus,
  EnrollmentPriority,
} from '../core/models/enrollment.model';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { UiNotice } from '../shared/models/ui-notice.model';

interface EnrollmentDraft {
  studentId: number | null;
  courseId: number | null;
  score: number | null;
  status: EnrollmentStatus;
  workflowStatus: EnrollmentWorkflowStatus;
  priority: EnrollmentPriority;
  operator: string;
  decisionReason: string;
}

@Component({
  selector: 'app-enrollment-edit',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, PageHeroComponent, InlineNoticeComponent],
  templateUrl: './enrollment-edit.component.html',
  styleUrl: './enrollment-edit.component.scss',
})
export class EnrollmentEditComponent {
  readonly statusOptions = ENROLLMENT_STATUS_OPTIONS;
  readonly workflowOptions = ENROLLMENT_WORKFLOW_OPTIONS;
  readonly priorityOptions = ENROLLMENT_PRIORITY_OPTIONS;
  readonly notice = signal<UiNotice | null>(null);

  readonly isCreateMode: boolean;
  private readonly enrollmentId: number | null;

  readonly allStudents = this.studentStore.students;
  readonly allCourses = this.courseStore.courses;

  readonly draft = signal<EnrollmentDraft>({
    studentId: null, courseId: null, score: null,
    status: 'enrolled', workflowStatus: 'pending-review', priority: 'attention',
    operator: '教务运营台', decisionReason: '待院系完成容量复核',
  });

  readonly pageTitle = computed(() => this.isCreateMode ? '新建选课' : '编辑选课');

  readonly draftStudentName = computed(() => {
    const sid = this.draft().studentId;
    if (!sid) return '未选择';
    return this.studentStore.getStudentById(sid)?.name ?? '未知学生';
  });

  readonly draftCourseName = computed(() => {
    const cid = this.draft().courseId;
    if (!cid) return '未选择';
    return this.courseStore.getCourseById(cid)?.name ?? '未知课程';
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly enrollmentStore: EnrollmentStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly courseStore: CourseStoreService,
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isCreateMode = !idParam;
    this.enrollmentId = idParam ? Number(idParam) : null;

    if (this.enrollmentId) {
      const existing = this.enrollmentStore.enrollments().find(e => e.id === this.enrollmentId);
      if (existing) {
        this.draft.set({
          studentId: existing.studentId,
          courseId: existing.courseId,
          score: existing.score,
          status: existing.status,
          workflowStatus: existing.workflowStatus,
          priority: existing.priority,
          operator: existing.operator,
          decisionReason: existing.decisionReason,
        });
      }
    } else {
      const students = this.allStudents();
      const courses = this.allCourses();
      if (students.length > 0 || courses.length > 0) {
        this.draft.update(d => ({
          ...d,
          studentId: students[0]?.id ?? null,
          courseId: courses[0]?.id ?? null,
        }));
      }
    }
  }

  updateField(field: keyof EnrollmentDraft, value: unknown): void {
    this.draft.update(prev => ({ ...prev, [field]: value }));
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d.studentId || !d.courseId) {
      this.notice.set({ type: 'error', text: '请选择学生和课程。' });
      return;
    }

    const payload = {
      studentId: Number(d.studentId),
      courseId: Number(d.courseId),
      score: d.score === null ? null : Number(d.score),
      status: d.status,
      workflowStatus: d.workflowStatus,
      priority: d.priority,
      operator: d.operator,
      decisionReason: d.decisionReason,
    };

    try {
      if (this.enrollmentId) {
        await this.enrollmentStore.updateEnrollment(this.enrollmentId, payload);
        this.notice.set({ type: 'success', text: '选课记录已更新。' });
      } else {
        await this.enrollmentStore.createEnrollment(payload);
        this.notice.set({ type: 'success', text: '选课记录创建成功。' });
      }
      setTimeout(() => this.router.navigateByUrl('/enrollments'), 600);
    } catch (e) {
      this.notice.set({ type: 'error', text: e instanceof Error ? e.message : '操作失败' });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }
}
