import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { STUDENT_GENDER_LABELS, Student } from '../../../core/models/student.model';
import { calculateAgeFromBirthDate } from '../../../core/utils/date-age.util';
import { scoreToGrade, type Grade } from '../../../core/utils/score-grade.util';

@Component({
  selector: 'app-student-table',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './student-table.component.html',
  styleUrl: './student-table.component.scss',
})
export class StudentTableComponent implements OnChanges {
  @Input({ required: true }) students: readonly Student[] = [];
  @Input() keyword = '';
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalFiltered = 0;
  @Input() pageSize = 15;

  @Output() readonly editRequested = new EventEmitter<number>();
  @Output() readonly deleteRequested = new EventEmitter<number>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly selectionChange = new EventEmitter<readonly number[]>();
  @Output() readonly sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();

  readonly genderLabels = STUDENT_GENDER_LABELS;
  selectedIds = new Set<number>();
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['students'] || changes['currentPage']) {
      this.selectedIds.clear();
      this.emitSelection();
    }
  }

  isAllSelected(): boolean {
    return this.students.length > 0 && this.students.every(s => this.selectedIds.has(s.id));
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      for (const s of this.students) {
        this.selectedIds.add(s.id);
      }
    } else {
      this.selectedIds.clear();
    }
    this.emitSelection();
  }

  toggleOne(id: number, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.emitSelection();
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.emitSelection();
  }

  private emitSelection(): void {
    this.selectionChange.emit([...this.selectedIds]);
  }

  requestEdit(studentId: number): void {
    this.editRequested.emit(studentId);
  }

  requestDelete(studentId: number): void {
    this.deleteRequested.emit(studentId);
  }

  computeAge(birthDate: string): number {
    return calculateAgeFromBirthDate(birthDate);
  }

  computeGrade(score: number): Grade {
    return scoreToGrade(score);
  }

  goTo(page: number): void {
    this.pageChange.emit(page);
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortChanged.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  get pageNumbers(): readonly number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalFiltered);
  }
}
