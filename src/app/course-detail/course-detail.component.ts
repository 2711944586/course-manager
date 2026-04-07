import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { map } from 'rxjs';
import { COURSE_STATUS_LABELS, CourseStatus, CourseUpsertInput } from '../core/models/course.model';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { scoreToGrade } from '../core/utils/score-grade.util';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { UiNotice } from '../shared/models/ui-notice.model';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatChipsModule, MatIconModule, MatRippleModule, InlineNoticeComponent, PageHeroComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss',
})
export class CourseDetailComponent {
  readonly statusLabels = COURSE_STATUS_LABELS;
  readonly notice = signal<UiNotice | null>(null);
  readonly progressDraft = signal(0);

  private readonly courseId = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id')) || 0)),
    { initialValue: 0 },
  );

  readonly course = computed(() => this.courseStore.getCourseById(this.courseId()));

  /** 模拟选课关联 — 根据课程 id 从学生池中分配学生 */
  readonly enrolledStudents = computed(() => {
    const c = this.course();
    if (!c) return [];

    const allStudents = this.studentStore.students();
    const totalCourses = Math.max(this.courseStore.courses().length, 1);
    return allStudents
      .filter(s => s.id % totalCourses === (c.id - 1) % totalCourses)
      .slice(0, c.students)
      .map(s => ({ ...s, grade: scoreToGrade(s.score) }));
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    effect(
      () => {
        const selectedCourse = this.course();
        this.progressDraft.set(selectedCourse?.progress ?? 0);
      },
      { allowSignalWrites: true },
    );
  }

  goBack(): void {
    void this.router.navigate(['/courses']);
  }

  onProgressInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const numericProgress = Number(target.value);
    this.progressDraft.set(this.clampProgress(numericProgress));
  }

  adjustProgress(delta: number): void {
    this.progressDraft.update(currentProgress => this.clampProgress(currentProgress + delta));
  }

  saveProgress(): void {
    const selectedCourse = this.course();
    if (!selectedCourse) {
      this.notice.set({ type: 'error', text: '课程不存在，无法保存进度。' });
      return;
    }

    try {
      this.courseStore.updateProgress(selectedCourse.id, this.progressDraft());
      this.notice.set({ type: 'success', text: '课程进度已保存。' });
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  changeStatus(status: CourseStatus): void {
    const selectedCourse = this.course();
    if (!selectedCourse) {
      this.notice.set({ type: 'error', text: '课程不存在，无法修改状态。' });
      return;
    }

    const nextProgress =
      status === 'completed'
        ? 100
        : status === 'planned'
          ? 0
          : Math.max(selectedCourse.progress, 1);

    const payload: CourseUpsertInput = {
      name: selectedCourse.name,
      instructor: selectedCourse.instructor,
      schedule: selectedCourse.schedule,
      description: selectedCourse.description,
      progress: nextProgress,
      students: selectedCourse.students,
      status,
      icon: selectedCourse.icon,
    };

    try {
      this.courseStore.updateCourse(selectedCourse.id, payload);
      this.progressDraft.set(nextProgress);
      this.notice.set({ type: 'success', text: '课程状态已更新。' });
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  async deleteCourse(): Promise<void> {
    const selectedCourse = this.course();
    if (!selectedCourse) {
      this.notice.set({ type: 'error', text: '课程不存在，无法删除。' });
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: '删除课程',
      message: `确认删除课程“${selectedCourse.name}”？该操作无法撤销。`,
      confirmText: '确认删除',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    try {
      this.courseStore.removeCourse(selectedCourse.id);
      void this.router.navigate(['/courses']);
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }

  private clampProgress(progress: number): number {
    const roundedProgress = Math.round(progress);
    if (roundedProgress < 0) {
      return 0;
    }

    if (roundedProgress > 100) {
      return 100;
    }

    return roundedProgress;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return '操作失败，请稍后重试。';
  }
}
