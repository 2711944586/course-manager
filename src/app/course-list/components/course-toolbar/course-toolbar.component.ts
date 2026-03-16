import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  COURSE_SORT_OPTIONS,
  COURSE_STATUS_OPTIONS,
  CourseSortKey,
  CourseStatus,
} from '../../../core/models/course.model';

export type CourseFilterStatus = 'all' | CourseStatus;

@Component({
  selector: 'app-course-toolbar',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './course-toolbar.component.html',
  styleUrl: './course-toolbar.component.scss',
})
export class CourseToolbarComponent {
  @Input({ required: true }) searchKeyword = '';
  @Input({ required: true }) selectedStatus: CourseFilterStatus = 'all';
  @Input({ required: true }) selectedSort: CourseSortKey = 'updatedAt';

  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly statusChange = new EventEmitter<CourseFilterStatus>();
  @Output() readonly sortChange = new EventEmitter<CourseSortKey>();
  @Output() readonly createRequested = new EventEmitter<void>();
  @Output() readonly exportRequested = new EventEmitter<void>();

  readonly statusOptions = COURSE_STATUS_OPTIONS;
  readonly sortOptions = COURSE_SORT_OPTIONS;

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  clearKeyword(): void {
    this.searchChange.emit('');
  }

  onStatusSelect(value: CourseFilterStatus): void {
    this.statusChange.emit(value);
  }

  onSortSelect(value: CourseSortKey): void {
    this.sortChange.emit(value);
  }

  requestCreate(): void {
    this.createRequested.emit();
  }

  requestExport(): void {
    this.exportRequested.emit();
  }
}
