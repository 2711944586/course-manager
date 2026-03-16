import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { Student, StudentSortKey, StudentUpsertInput } from '../core/models/student.model';
import { StudentStoreService } from '../core/services/student-store.service';
import { exportCsv } from '../core/utils/csv-export.util';
import { calculateAgeFromBirthDate } from '../core/utils/date-age.util';
import { scoreToGrade, GRADE_ORDER, isPassingScore } from '../core/utils/score-grade.util';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InlineNoticeComponent } from '../shared/components/inline-notice/inline-notice.component';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { UiNotice } from '../shared/models/ui-notice.model';
import { StudentEditorComponent } from './components/student-editor/student-editor.component';
import { StudentStatsComponent, StudentStatsView } from './components/student-stats/student-stats.component';
import { StudentFilterGender, StudentToolbarComponent } from './components/student-toolbar/student-toolbar.component';
import { StudentTableComponent } from './components/student-table/student-table.component';
import { StudentCardComponent } from './components/student-card/student-card.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    StudentStatsComponent,
    StudentToolbarComponent,
    StudentEditorComponent,
    StudentTableComponent,
    StudentCardComponent,
    PageHeroComponent,
    InlineNoticeComponent,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
})
export class StudentsComponent {
  readonly searchKeyword = signal('');
  readonly selectedGender = signal<StudentFilterGender>('all');
  readonly selectedSort = signal<StudentSortKey>('updatedAt');
  readonly editingStudentId = signal<number | null>(null);
  readonly creating = signal(false);
  readonly notice = signal<UiNotice | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);
  readonly selectedStudentIds = signal<readonly number[]>([]);
  readonly viewMode = signal<'table' | 'card'>('card');

  readonly students = this.studentStore.students;
  readonly filteredStudents = computed(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    const selectedGender = this.selectedGender();
    const selectedSort = this.selectedSort();

    const filteredStudentList = this.students().filter(student => {
      const genderMatched = selectedGender === 'all' || student.gender === selectedGender;
      const keywordMatched =
        keyword.length === 0 ||
        [student.name, student.studentNo].some(field => field.toLowerCase().includes(keyword));

      return genderMatched && keywordMatched;
    });

    return [...filteredStudentList].sort((firstStudent, secondStudent) =>
      this.compareStudents(firstStudent, secondStudent, selectedSort),
    );
  });

  readonly totalFiltered = computed(() => this.filteredStudents().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));
  readonly paginatedStudents = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredStudents().slice(start, start + size);
  });

  readonly stats = computed<StudentStatsView>(() => {
    const studentList = this.students();
    const maleStudents = studentList.filter(student => student.gender === 'male').length;
    const femaleStudents = studentList.length - maleStudents;
    const averageAge =
      studentList.length > 0
        ? Math.round(
            studentList.reduce((totalAge, student) => totalAge + calculateAgeFromBirthDate(student.birthDate), 0) /
              studentList.length,
          )
        : 0;

    const averageScore =
      studentList.length > 0
        ? Math.round(
            studentList.reduce((total, student) => total + student.score, 0) / studentList.length,
          )
        : 0;

    const passRate =
      studentList.length > 0
        ? Math.round(
            (studentList.filter(s => isPassingScore(s.score)).length / studentList.length) * 100,
          )
        : 0;

    const excellentRate =
      studentList.length > 0
        ? Math.round(
            (studentList.filter(s => s.score >= 90).length / studentList.length) * 100,
          )
        : 0;

    const gradeDistribution: Record<string, number> = {};
    for (const grade of GRADE_ORDER) {
      gradeDistribution[grade] = 0;
    }
    for (const student of studentList) {
      const grade = scoreToGrade(student.score);
      gradeDistribution[grade] = (gradeDistribution[grade] ?? 0) + 1;
    }

    const sortedByBirthDate = [...studentList].sort((firstStudent, secondStudent) =>
      firstStudent.birthDate.localeCompare(secondStudent.birthDate),
    );

    return {
      totalStudents: studentList.length,
      maleStudents,
      femaleStudents,
      averageAge,
      averageScore,
      passRate,
      excellentRate,
      gradeDistribution,
      oldestBirthDate: sortedByBirthDate[0]?.birthDate ?? '-',
      youngestBirthDate: sortedByBirthDate[sortedByBirthDate.length - 1]?.birthDate ?? '-',
    };
  });

  readonly editingStudent = computed(() => {
    const currentEditingStudentId = this.editingStudentId();
    if (currentEditingStudentId === null) {
      return null;
    }

    return this.studentStore.getStudentById(currentEditingStudentId) ?? null;
  });

  readonly showEditor = computed(() => this.creating() || this.editingStudentId() !== null);

  private readonly routeMode = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('mode'))),
    { initialValue: null },
  );

  constructor(
    private readonly studentStore: StudentStoreService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
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
    this.currentPage.set(1);
  }

  handleGenderChange(gender: StudentFilterGender): void {
    this.selectedGender.set(gender);
    this.currentPage.set(1);
  }

  handleSortChange(sortKey: StudentSortKey): void {
    this.selectedSort.set(sortKey);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  startCreate(): void {
    void this.router.navigate(['/students/create']);
  }

  startEdit(studentId: number): void {
    void this.router.navigate(['/students/edit', studentId]);
  }

  cancelEdit(): void {
    this.creating.set(false);
    this.editingStudentId.set(null);
  }

  saveStudent(payload: StudentUpsertInput): void {
    try {
      const currentEditingStudentId = this.editingStudentId();

      if (currentEditingStudentId !== null) {
        this.studentStore.updateStudent(currentEditingStudentId, payload);
        this.notice.set({ type: 'success', text: '学生信息已更新。' });
      } else {
        this.studentStore.createStudent(payload);
        this.notice.set({ type: 'success', text: '学生创建成功。' });
      }

      this.cancelEdit();
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  deleteStudent(studentId: number): void {
    const targetStudent = this.studentStore.getStudentById(studentId);
    if (!targetStudent) {
      this.notice.set({ type: 'error', text: '学生不存在或已被删除。' });
      return;
    }

    const confirmed = window.confirm(`确认删除学生“${targetStudent.name}”？该操作无法撤销。`);
    if (!confirmed) {
      return;
    }

    try {
      this.studentStore.removeStudent(studentId);
      if (this.editingStudentId() === studentId) {
        this.cancelEdit();
      }
      this.notice.set({ type: 'success', text: '学生已删除。' });
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  regenerateFakeData(): void {
    const confirmed = window.confirm('确认重置为批量 Fake 学生数据？现有学生数据将被覆盖。');
    if (!confirmed) {
      return;
    }

    try {
      this.studentStore.regenerateFakeStudents(120);
      this.cancelEdit();
      this.notice.set({ type: 'success', text: 'Fake 数据已重置，已生成 120 条学生记录。' });
    } catch (error) {
      this.notice.set({ type: 'error', text: this.extractErrorMessage(error) });
    }
  }

  closeNotice(): void {
    this.notice.set(null);
  }

  exportStudents(): void {
    const students = this.filteredStudents();
    const headers = ['姓名', '学号', '性别', '出生日期', '年龄', '成绩', '等级', '更新时间'] as const;
    const rows = students.map(s => [
      s.name,
      s.studentNo,
      s.gender,
      s.birthDate,
      calculateAgeFromBirthDate(s.birthDate),
      s.score,
      scoreToGrade(s.score),
      s.updatedAt,
    ] as const);
    exportCsv('students-export', headers, rows);
    this.notice.set({ type: 'success', text: `已导出 ${students.length} 条学生数据。` });
  }

  private compareStudents(firstStudent: Student, secondStudent: Student, sortKey: StudentSortKey): number {
    if (sortKey === 'name') {
      return firstStudent.name.localeCompare(secondStudent.name, 'zh-CN');
    }

    if (sortKey === 'studentNo') {
      return firstStudent.studentNo.localeCompare(secondStudent.studentNo);
    }

    if (sortKey === 'birthDate') {
      return firstStudent.birthDate.localeCompare(secondStudent.birthDate);
    }

    if (sortKey === 'score') {
      return secondStudent.score - firstStudent.score;
    }

    return new Date(secondStudent.updatedAt).getTime() - new Date(firstStudent.updatedAt).getTime();
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return '操作失败，请稍后重试。';
  }

  handleSelectionChange(ids: readonly number[]): void {
    this.selectedStudentIds.set(ids);
  }

  batchDeleteStudents(): void {
    const ids = this.selectedStudentIds();
    if (ids.length === 0) return;

    const confirmed = window.confirm(`确认批量删除 ${ids.length} 名学生？该操作无法撤销。`);
    if (!confirmed) return;

    const count = this.studentStore.removeMany(ids);
    this.selectedStudentIds.set([]);
    this.notice.set({ type: 'success', text: `已批量删除 ${count} 名学生。` });
  }
}
