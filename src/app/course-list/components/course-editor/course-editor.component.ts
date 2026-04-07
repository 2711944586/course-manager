import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  COURSE_STATUS_OPTIONS,
  Course,
  CourseStatus,
  CourseUpsertInput,
} from '../../../core/models/course.model';

type CourseEditorMode = 'create' | 'edit';
type CourseFormControlName =
  | 'name'
  | 'instructor'
  | 'schedule'
  | 'description'
  | 'progress'
  | 'students'
  | 'status'
  | 'icon';

@Component({
  selector: 'app-course-editor',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './course-editor.component.html',
  styleUrl: './course-editor.component.scss',
})
export class CourseEditorComponent {
  @Input({ required: true }) mode: CourseEditorMode = 'create';
  @Input() set course(value: Course | null) {
    this.patchForm(value);
  }

  @Output() readonly saveRequested = new EventEmitter<CourseUpsertInput>();
  @Output() readonly cancelRequested = new EventEmitter<void>();

  readonly statusOptions = COURSE_STATUS_OPTIONS;
  readonly iconOptions = [
    { value: 'menu_book', label: '课程' },
    { value: 'functions', label: '数学' },
    { value: 'account_tree', label: '算法' },
    { value: 'storage', label: '数据库' },
    { value: 'lan', label: '网络' },
    { value: 'psychology', label: '洞察' },
    { value: 'memory', label: '系统' },
  ] as const;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    instructor: ['', [Validators.required]],
    schedule: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    students: [0, [Validators.required, Validators.min(0)]],
    status: ['planned' as CourseStatus, [Validators.required]],
    icon: ['menu_book', [Validators.required]],
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload: CourseUpsertInput = {
      name: rawValue.name.trim(),
      instructor: rawValue.instructor.trim(),
      schedule: rawValue.schedule.trim(),
      description: rawValue.description.trim(),
      progress: Number(rawValue.progress),
      students: Number(rawValue.students),
      status: rawValue.status,
      icon: rawValue.icon,
    };

    this.saveRequested.emit(payload);
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  isInvalid(controlName: CourseFormControlName): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(controlName: CourseFormControlName): string {
    const control = this.form.controls[controlName];
    if (control.hasError('required')) {
      return '此字段不能为空';
    }

    if (control.hasError('minlength')) {
      return '输入长度不足';
    }

    if (control.hasError('min') || control.hasError('max')) {
      return '输入超出允许范围';
    }

    return '输入不合法';
  }

  private patchForm(course: Course | null): void {
    if (!course) {
      this.form.reset(
        {
          name: '',
          instructor: '',
          schedule: '',
          description: '',
          progress: 0,
          students: 0,
          status: 'planned',
          icon: 'menu_book',
        },
        { emitEvent: false },
      );
      return;
    }

    this.form.reset(
      {
        name: course.name,
        instructor: course.instructor,
        schedule: course.schedule,
        description: course.description,
        progress: course.progress,
        students: course.students,
        status: course.status,
        icon: course.icon,
      },
      { emitEvent: false },
    );
  }
}
