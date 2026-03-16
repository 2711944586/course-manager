import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { Course, CourseSortKey, CourseStatus, CourseUpsertInput } from '../core/models/course.model';
import { CourseStoreService } from '../core/services/course-store.service';
import { exportCsv } from '../core/utils/csv-export.util';
import { detectScheduleConflicts } from '../core/utils/course-schedule.util';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { UiNotice } from '../shared/models/ui-notice.model';
import { CourseCardsComponent } from './components/course-cards/course-cards.component';
import { CourseEditorComponent } from './components/course-editor/course-editor.component';
import { CourseStatsComponent, CourseStatsView } from './components/course-stats/course-stats.component';
import { CourseFilterStatus, CourseToolbarComponent } from './components/course-toolbar/course-toolbar.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CourseStatsComponent,
    CourseToolbarComponent,
    CourseEditorComponent,
    CourseCardsComponent,
    PageHeroComponent,
    InlineNoticeComponent,
  ],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss',
})
export class CourseListComponent {
  readonly searchKeyword = signal('');
  readonly selectedStatus = signal<CourseFilterStatus>('all');
  readonly selectedSort = signal<CourseSortKey>('updatedAt');
  readonly editingCourseId = signal<number | null>(null);
  readonly creating = signal(false);
  readonly notice = signal<UiNotice | null>(null);

  readonly courses = this.courseStore.courses;
  readonly filteredCourses = computed(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    const selectedStatus = this.selectedStatus();
    const selectedSort = this.selectedSort();

    const filteredCourseList = this.courses().filter(course => {
      const statusMatched = selectedStatus === 'all' || course.status === selectedStatus;
      const keywordMatched =
        keyword.length === 0 ||
        [course.name, course.instructor, course.schedule].some(field =>
          field.toLowerCase().includes(keyword),
        );

      return statusMatched && keywordMatched;
    });

    return [...filteredCourseList].sort((firstCourse, secondCourse) =>
      this.compareCourses(firstCourse, secondCourse, selectedSort),
    );
  });

  readonly stats = computed<CourseStatsView>(() => {
    const courseList = this.courses();
    const totalStudents = courseList.reduce(
      (studentCount, course) => studentCount + course.students,
      0,
    );
    const averageProgress =
      courseList.length > 0
        ? Math.round(
            courseList.reduce((totalProgress, course) => totalProgress + course.progress, 0) /
              courseList.length,
          )
        : 0;

    return {
      totalCourses: courseList.length,
      activeCourses: courseList.filter(course => course.status === 'active').length,
      plannedCourses: courseList.filter(course => course.status === 'planned').length,
      completedCourses: courseList.filter(course => course.status === 'completed').length,
      averageProgress,
      totalStudents,
    };
  });

  readonly editingCourse = computed(() => {
    const currentEditingCourseId = this.editingCourseId();
    if (currentEditingCourseId === null) {
      return null;
    }

    return this.courseStore.getCourseById(currentEditingCourseId) ?? null;
  });

  readonly showEditor = computed(() => this.creating() || this.editingCourseId() !== null);

  private readonly routeStatus = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('status'))),
    { initialValue: null },
  );
  private readonly routeMode = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('mode'))),
    { initialValue: null },
  );

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly courseStore: CourseStoreService,
  ) {
    effect(
      () => {
        const status = this.routeStatus();
        if (this.isCourseStatus(status)) {
          this.selectedStatus.set(status);
          return;
        }

        this.selectedStatus.set('all');
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        if (this.routeMode() !== 'create') {
          return;
        }

        this.startCreate();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { mode: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      },
      { allowSignalWrites: true },
    );
  }

  handleSearchChange(keyword: string): void {
    this.searchKeyword.set(keyword);
  }

  handleStatusChange(status: CourseFilterStatus): void {
    this.selectedStatus.set(status);
    void this.router.navigate(['/courses'], {
      queryParams: status === 'all' ? {} : { status },
      replaceUrl: true,
    });
  }

  handleSortChange(sortKey: CourseSortKey): void {
    this.selectedSort.set(sortKey);
  }

  startCreate(): void {
    void this.router.navigate(['/courses/create']);
  }

  startEdit(courseId: number): void {
    void this.router.navigate(['/courses/edit', courseId]);
  }

  cancelEdit(): void {
    this.creating.set(false);
    this.editingCourseId.set(null);
  }

  viewDetail(courseId: number): void {
    void this.router.navigate(['/courses/detail', courseId]);
  }

  saveCourse(payload: CourseUpsertInput): void {
    try {
      const currentEditingCourseId = this.editingCourseId();

      // 排课冲突检测
      const conflicts = detectScheduleConflicts(
        this.courseStore.courses(),
        payload.schedule,
        payload.instructor,
        currentEditingCourseId ?? undefined,
      );

      if (conflicts.length > 0) {
        const proceed = window.confirm(
          `检测到排课冲突：\n${conflicts.join('\n')}\n\n是否仍然保存？`,
        );
        if (!proceed) return;
      }

      if (currentEditingCourseId !== null) {
        this.courseStore.updateCourse(currentEditingCourseId, payload);
        this.notice.set({ type: 'success', text: '课程信息已更新。' });
      } else {
        this.courseStore.createCourse(payload);
        this.notice.set({ type: 'success', text: '课程创建成功。' });
      }

      this.cancelEdit();
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  deleteCourse(courseId: number): void {
    const currentCourse = this.courseStore.getCourseById(courseId);
    if (!currentCourse) {
      this.notice.set({ type: 'error', text: '课程不存在或已被删除。' });
      return;
    }

    const confirmed = window.confirm(`确认删除课程“${currentCourse.name}”？该操作无法撤销。`);
    if (!confirmed) {
      return;
    }

    try {
      this.courseStore.removeCourse(courseId);
      if (this.editingCourseId() === courseId) {
        this.cancelEdit();
      }
      this.notice.set({ type: 'success', text: '课程已删除。' });
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }

  exportCourses(): void {
    const courses = this.filteredCourses();
    const headers = ['名称', '教师', '时间', '状态', '进度%', '学生数', '更新时间'] as const;
    const rows = courses.map(c => [
      c.name,
      c.instructor,
      c.schedule,
      c.status,
      c.progress,
      c.students,
      c.updatedAt,
    ] as const);
    exportCsv('courses-export', headers, rows);
    this.notice.set({ type: 'success', text: `已导出 ${courses.length} 条课程数据。` });
  }

  private isCourseStatus(status: string | null): status is CourseStatus {
    return status === 'planned' || status === 'active' || status === 'completed';
  }

  private compareCourses(firstCourse: Course, secondCourse: Course, sortKey: CourseSortKey): number {
    if (sortKey === 'name') {
      return firstCourse.name.localeCompare(secondCourse.name, 'zh-CN');
    }

    if (sortKey === 'progress') {
      return secondCourse.progress - firstCourse.progress;
    }

    if (sortKey === 'students') {
      return secondCourse.students - firstCourse.students;
    }

    return (
      new Date(secondCourse.updatedAt).getTime() - new Date(firstCourse.updatedAt).getTime()
    );
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return '操作失败，请稍后重试。';
  }
}
