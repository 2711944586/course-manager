import { Component, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { StudentStoreService } from '../core/services/student-store.service';
import { STUDENT_GENDER_LABELS } from '../core/models/student.model';
import { calculateAgeFromBirthDate } from '../core/utils/date-age.util';
import { scoreToGrade, GRADE_LABELS } from '../core/utils/score-grade.util';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatRippleModule, PageHeroComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss',
})
export class StudentDetailComponent {
  private readonly studentId: number;

  readonly student = computed(() => this.studentStore.getStudentById(this.studentId));
  readonly age = computed(() => {
    const s = this.student();
    return s ? calculateAgeFromBirthDate(s.birthDate) : 0;
  });
  readonly grade = computed(() => {
    const s = this.student();
    return s ? scoreToGrade(s.score) : '-';
  });
  readonly genderLabel = computed(() => {
    const s = this.student();
    return s ? STUDENT_GENDER_LABELS[s.gender] : '';
  });

  readonly gradeLabels = GRADE_LABELS;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly studentStore: StudentStoreService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
  }

  async deleteStudent(): Promise<void> {
    const s = this.student();
    if (s && await this.confirmDialog.confirm({
      title: '删除学生',
      message: `确定删除学生「${s.name}」？此操作不可撤销。`,
      confirmText: '确认删除',
      tone: 'danger',
    })) {
      this.studentStore.removeStudent(s.id);
      this.router.navigateByUrl('/students');
    }
  }
}
