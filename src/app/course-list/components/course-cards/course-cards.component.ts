import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { COURSE_STATUS_LABELS, Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-course-cards',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './course-cards.component.html',
  styleUrl: './course-cards.component.scss',
})
export class CourseCardsComponent {
  @Input({ required: true }) courses: readonly Course[] = [];
  @Input() keyword = '';

  @Output() readonly viewRequested = new EventEmitter<number>();
  @Output() readonly editRequested = new EventEmitter<number>();
  @Output() readonly deleteRequested = new EventEmitter<number>();
  @Output() readonly previewRequested = new EventEmitter<number>();

  readonly statusLabels = COURSE_STATUS_LABELS;

  requestView(courseId: number): void {
    this.viewRequested.emit(courseId);
  }

  requestPreview(courseId: number): void {
    this.previewRequested.emit(courseId);
  }

  requestEdit(event: Event, courseId: number): void {
    event.stopPropagation();
    this.editRequested.emit(courseId);
  }

  requestDelete(event: Event, courseId: number): void {
    event.stopPropagation();
    this.deleteRequested.emit(courseId);
  }

  formatUpdateTime(updatedAt: string): string {
    return new Date(updatedAt).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
