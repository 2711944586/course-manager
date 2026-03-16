import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  STUDENT_GENDER_OPTIONS,
  STUDENT_SORT_OPTIONS,
  StudentGender,
  StudentSortKey,
} from '../../../core/models/student.model';

export type StudentFilterGender = 'all' | StudentGender;

@Component({
  selector: 'app-student-toolbar',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './student-toolbar.component.html',
  styleUrl: './student-toolbar.component.scss',
})
export class StudentToolbarComponent {
  @Input({ required: true }) searchKeyword = '';
  @Input({ required: true }) selectedGender: StudentFilterGender = 'all';
  @Input({ required: true }) selectedSort: StudentSortKey = 'updatedAt';

  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly genderChange = new EventEmitter<StudentFilterGender>();
  @Output() readonly sortChange = new EventEmitter<StudentSortKey>();
  @Output() readonly createRequested = new EventEmitter<void>();
  @Output() readonly regenerateRequested = new EventEmitter<void>();
  @Output() readonly exportRequested = new EventEmitter<void>();

  readonly genderOptions = STUDENT_GENDER_OPTIONS;
  readonly sortOptions = STUDENT_SORT_OPTIONS;

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  clearKeyword(): void {
    this.searchChange.emit('');
  }

  onGenderSelect(value: StudentFilterGender): void {
    this.genderChange.emit(value);
  }

  onSortSelect(value: StudentSortKey): void {
    this.sortChange.emit(value);
  }

  requestCreate(): void {
    this.createRequested.emit();
  }

  requestRegenerate(): void {
    this.regenerateRequested.emit();
  }

  requestExport(): void {
    this.exportRequested.emit();
  }
}
