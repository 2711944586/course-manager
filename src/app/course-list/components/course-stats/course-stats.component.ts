import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface CourseStatsView {
  readonly totalCourses: number;
  readonly activeCourses: number;
  readonly plannedCourses: number;
  readonly completedCourses: number;
  readonly averageProgress: number;
  readonly totalStudents: number;
}

@Component({
  selector: 'app-course-stats',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './course-stats.component.html',
  styleUrl: './course-stats.component.scss',
})
export class CourseStatsComponent {
  readonly stats = input.required<CourseStatsView>();
}
