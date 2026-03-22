import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Student, STUDENT_GENDER_LABELS } from '../../../core/models/student.model';
import { calculateAgeFromBirthDate } from '../../../core/utils/date-age.util';
import { scoreToGrade, GRADE_LABELS, type Grade } from '../../../core/utils/score-grade.util';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.scss',
})
export class StudentCardComponent {
  @Input({ required: true }) student!: Student;

  @Output() readonly editRequested = new EventEmitter<number>();
  @Output() readonly deleteRequested = new EventEmitter<number>();
  @Output() readonly previewRequested = new EventEmitter<number>();

  get age(): number {
    return calculateAgeFromBirthDate(this.student.birthDate);
  }

  get grade(): Grade {
    return scoreToGrade(this.student.score);
  }

  get gradeLabel(): string {
    return GRADE_LABELS[this.grade];
  }

  get genderLabel(): string {
    return STUDENT_GENDER_LABELS[this.student.gender];
  }
}
