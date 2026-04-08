import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import {
  TEACHER_STATUS_OPTIONS,
  TeacherStatus,
  TeacherUpsertInput,
} from '../core/models/teacher.model';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { UiNotice } from '../shared/models/ui-notice.model';

interface TeacherDraft {
  employeeNo: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  office: string;
  expertiseText: string;
  maxWeeklyHours: number;
  currentWeeklyHours: number;
  status: TeacherStatus;
}

@Component({
  selector: 'app-teacher-edit',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, PageHeroComponent, InlineNoticeComponent],
  templateUrl: './teacher-edit.component.html',
  styleUrl: './teacher-edit.component.scss',
})
export class TeacherEditComponent {
  readonly statusOptions = TEACHER_STATUS_OPTIONS;
  readonly notice = signal<UiNotice | null>(null);

  readonly isCreateMode: boolean;
  private readonly teacherId: number | null;

  readonly draft = signal<TeacherDraft>({
    employeeNo: '', name: '', title: '讲师', department: '',
    email: '', phone: '', office: '',
    expertiseText: '课程建设, 学业督导',
    maxWeeklyHours: 12, currentWeeklyHours: 8, status: 'active',
  });

  readonly pageTitle = computed(() => this.isCreateMode ? '新建教师' : '编辑教师');
  readonly draftStatusLabel = computed(() => {
    const s = this.draft().status;
    return this.statusOptions.find(o => o.value === s)?.label ?? s;
  });
  readonly draftLoadPercent = computed(() => {
    const d = this.draft();
    return d.maxWeeklyHours > 0 ? Math.min(160, Math.round((d.currentWeeklyHours / d.maxWeeklyHours) * 100)) : 0;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teacherStore: TeacherStoreService,
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isCreateMode = !idParam;
    this.teacherId = idParam ? Number(idParam) : null;

    if (this.teacherId) {
      const existing = this.teacherStore.teachers().find(t => t.id === this.teacherId);
      if (existing) {
        this.draft.set({
          employeeNo: existing.employeeNo,
          name: existing.name,
          title: existing.title,
          department: existing.department,
          email: existing.email,
          phone: existing.phone,
          office: existing.office,
          expertiseText: existing.expertise.join(', '),
          maxWeeklyHours: existing.maxWeeklyHours,
          currentWeeklyHours: existing.currentWeeklyHours,
          status: existing.status,
        });
      }
    } else {
      const teachers = this.teacherStore.teachers();
      const maxSeq = teachers.reduce((m, t) => {
        const n = Number.parseInt(t.employeeNo.replace(/\D/g, ''), 10);
        return Number.isFinite(n) ? Math.max(m, n) : m;
      }, 26000) + 1;
      this.draft.update(d => ({ ...d, employeeNo: `T${String(maxSeq).padStart(5, '0')}` }));
    }
  }

  updateField(field: keyof TeacherDraft, value: string | number): void {
    this.draft.update(prev => ({ ...prev, [field]: value }));
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d.name.trim() || !d.employeeNo.trim()) {
      this.notice.set({ type: 'error', text: '请填写工号和姓名。' });
      return;
    }

    const payload: TeacherUpsertInput = {
      employeeNo: d.employeeNo,
      name: d.name,
      title: d.title,
      department: d.department,
      email: d.email,
      phone: d.phone,
      office: d.office,
      expertise: d.expertiseText.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      maxWeeklyHours: Number(d.maxWeeklyHours),
      currentWeeklyHours: Number(d.currentWeeklyHours),
      status: d.status,
      active: d.status === 'active',
    };

    try {
      if (this.teacherId) {
        await this.teacherStore.updateTeacher(this.teacherId, payload);
        this.notice.set({ type: 'success', text: '教师信息已更新。' });
        setTimeout(() => this.router.navigateByUrl('/teachers'), 600);
      } else {
        await this.teacherStore.createTeacher(payload);
        this.notice.set({ type: 'success', text: '教师创建成功。' });
        setTimeout(() => this.router.navigateByUrl('/teachers'), 600);
      }
    } catch (e) {
      this.notice.set({ type: 'error', text: e instanceof Error ? e.message : '操作失败' });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }
}
