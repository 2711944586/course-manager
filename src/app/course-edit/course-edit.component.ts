import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CourseStoreService } from '../core/services/course-store.service';
import { COURSE_STATUS_OPTIONS, CourseUpsertInput } from '../core/models/course.model';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { UiNotice } from '../shared/models/ui-notice.model';

@Component({
  selector: 'app-course-edit',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, PageHeroComponent, InlineNoticeComponent],
  templateUrl: './course-edit.component.html',
  styleUrl: './course-edit.component.scss',
})
export class CourseEditComponent {
  readonly statusOptions = COURSE_STATUS_OPTIONS;
  readonly iconOptions = [
    { value: 'menu_book', label: '课程' },
    { value: 'functions', label: '数学' },
    { value: 'account_tree', label: '算法' },
    { value: 'storage', label: '数据库' },
    { value: 'lan', label: '网络' },
    { value: 'psychology', label: 'AI' },
    { value: 'memory', label: '系统' },
    { value: 'engineering', label: '工程' },
    { value: 'code', label: '编译' },
    { value: 'analytics', label: '统计' },
    { value: 'web', label: '前端' },
    { value: 'grid_on', label: '代数' },
    { value: 'translate', label: '语言' },
  ];
  readonly notice = signal<UiNotice | null>(null);

  readonly isCreateMode: boolean;
  private readonly courseId: number | null;

  readonly draft = signal<CourseUpsertInput>({
    name: '', instructor: '', schedule: '', description: '',
    progress: 0, students: 0, status: 'planned', icon: 'menu_book',
  });

  readonly pageTitle = computed(() => this.isCreateMode ? '新建课程' : '编辑课程');
  readonly draftStatusLabel = computed(() => {
    const s = this.draft().status;
    return this.statusOptions.find(o => o.value === s)?.label ?? s;
  });
  readonly draftIconLabel = computed(() => {
    const i = this.draft().icon;
    return this.iconOptions.find(o => o.value === i)?.label ?? i;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly courseStore: CourseStoreService,
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isCreateMode = !idParam;
    this.courseId = idParam ? Number(idParam) : null;

    if (this.courseId) {
      const existing = this.courseStore.getCourseById(this.courseId);
      if (existing) {
        this.draft.set({
          name: existing.name,
          instructor: existing.instructor,
          schedule: existing.schedule,
          description: existing.description,
          progress: existing.progress,
          students: existing.students,
          status: existing.status,
          icon: existing.icon,
        });
      }
    }
  }

  updateField(field: keyof CourseUpsertInput, value: string | number): void {
    this.draft.update(prev => ({
      ...prev,
      [field]: (field === 'progress' || field === 'students') ? Number(value) : value,
    }));
  }

  save(): void {
    const d = this.draft();
    if (!d.name.trim() || !d.instructor.trim()) {
      this.notice.set({ type: 'error', text: '请填写课程名称和教师。' });
      return;
    }
    if (d.description.trim().length < 10) {
      this.notice.set({ type: 'error', text: '课程描述至少 10 个字符。' });
      return;
    }

    try {
      if (this.courseId) {
        this.courseStore.updateCourse(this.courseId, d);
        this.notice.set({ type: 'success', text: '课程信息已更新。' });
        setTimeout(() => this.router.navigateByUrl(`/courses/detail/${this.courseId}`), 600);
      } else {
        const created = this.courseStore.createCourse(d);
        this.notice.set({ type: 'success', text: '课程创建成功。' });
        setTimeout(() => this.router.navigateByUrl(`/courses/detail/${created.id}`), 600);
      }
    } catch (e) {
      this.notice.set({ type: 'error', text: e instanceof Error ? e.message : '操作失败' });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }
}
