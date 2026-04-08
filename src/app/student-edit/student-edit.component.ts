import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StudentStoreService } from '../core/services/student-store.service';
import { STUDENT_GENDER_OPTIONS, StudentUpsertInput } from '../core/models/student.model';
import { scoreToGrade, GRADE_LABELS } from '../core/utils/score-grade.util';
import { calculateAgeFromBirthDate } from '../core/utils/date-age.util';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { UiNotice } from '../shared/models/ui-notice.model';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, PageHeroComponent, InlineNoticeComponent],
  templateUrl: './student-edit.component.html',
  styleUrl: './student-edit.component.scss',
})
export class StudentEditComponent {
  readonly genderOptions = STUDENT_GENDER_OPTIONS;
  readonly gradeLabels = GRADE_LABELS;
  readonly notice = signal<UiNotice | null>(null);

  readonly isCreateMode: boolean;
  private readonly studentId: number | null;

  readonly draft = signal<StudentUpsertInput>({
    name: '', studentNo: '', gender: 'male', birthDate: '2005-01-01', score: 75,
  });

  readonly draftGrade = computed(() => scoreToGrade(this.draft().score));
  readonly draftAge = computed(() => calculateAgeFromBirthDate(this.draft().birthDate));
  readonly draftGenderLabel = computed(() => {
    const g = this.draft().gender;
    return this.genderOptions.find(o => o.value === g)?.label ?? g;
  });
  readonly pageTitle = computed(() => this.isCreateMode ? '新建学生' : '编辑学生');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly studentStore: StudentStoreService,
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isCreateMode = !idParam;
    this.studentId = idParam ? Number(idParam) : null;

    if (this.studentId) {
      const existing = this.studentStore.getStudentById(this.studentId);
      if (existing) {
        this.draft.set({
          name: existing.name,
          studentNo: existing.studentNo,
          gender: existing.gender,
          birthDate: existing.birthDate,
          score: existing.score,
        });
      }
    }
  }

  updateField(field: keyof StudentUpsertInput, value: string | number): void {
    this.draft.update(prev => ({
      ...prev,
      [field]: field === 'score' ? Number(value) : value,
    }));
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d.name.trim() || !d.studentNo.trim() || !d.birthDate) {
      this.notice.set({ type: 'error', text: '请填写所有必填字段。' });
      return;
    }

    try {
      if (this.studentId) {
        await this.studentStore.updateStudent(this.studentId, d);
        this.notice.set({ type: 'success', text: '学生信息已更新。' });
        setTimeout(() => this.router.navigateByUrl(`/students/detail/${this.studentId}`), 600);
      } else {
        const created = await this.studentStore.createStudent(d);
        this.notice.set({ type: 'success', text: '学生创建成功。' });
        setTimeout(() => this.router.navigateByUrl(`/students/detail/${created.id}`), 600);
      }
    } catch (e) {
      this.notice.set({ type: 'error', text: e instanceof Error ? e.message : '操作失败' });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }
}
