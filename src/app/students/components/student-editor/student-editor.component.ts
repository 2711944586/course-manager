import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  STUDENT_GENDER_OPTIONS,
  Student,
  StudentGender,
  StudentUpsertInput,
} from '../../../core/models/student.model';
import { scoreToGrade, GRADE_LABELS } from '../../../core/utils/score-grade.util';

type StudentEditorMode = 'create' | 'edit';
type StudentControlName = 'name' | 'studentNo' | 'gender' | 'birthDate' | 'score';

@Component({
  selector: 'app-student-editor',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './student-editor.component.html',
  styleUrl: './student-editor.component.scss',
})
export class StudentEditorComponent {
  @Input({ required: true }) mode: StudentEditorMode = 'create';
  @Input() set student(value: Student | null) {
    this.patchForm(value);
  }

  @Output() readonly saveRequested = new EventEmitter<StudentUpsertInput>();
  @Output() readonly cancelRequested = new EventEmitter<void>();

  readonly genderOptions = STUDENT_GENDER_OPTIONS;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    studentNo: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
    gender: ['male' as StudentGender, [Validators.required]],
    birthDate: ['', [Validators.required]],
    score: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  get gradeLabel(): string {
    const score = this.form.controls.score.value;
    const grade = scoreToGrade(score);
    return `${grade} (${GRADE_LABELS[grade]})`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload: StudentUpsertInput = {
      name: rawValue.name.trim(),
      studentNo: rawValue.studentNo.trim(),
      gender: rawValue.gender,
      birthDate: rawValue.birthDate,
      score: rawValue.score,
    };

    this.saveRequested.emit(payload);
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  isInvalid(controlName: StudentControlName): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(controlName: StudentControlName): string {
    const control = this.form.controls[controlName];
    if (control.hasError('required')) {
      return '此字段不能为空';
    }

    if (control.hasError('minlength')) {
      return '输入长度不足';
    }

    if (control.hasError('pattern')) {
      return '格式不正确';
    }

    return '输入不合法';
  }

  private patchForm(student: Student | null): void {
    if (!student) {
      this.form.reset(
        {
          name: '',
          studentNo: '',
          gender: 'male',
          birthDate: '2005-01-01',
          score: 75,
        },
        { emitEvent: false },
      );
      return;
    }

    this.form.reset(
      {
        name: student.name,
        studentNo: student.studentNo,
        gender: student.gender,
        birthDate: student.birthDate,
        score: student.score,
      },
      { emitEvent: false },
    );
  }
}
