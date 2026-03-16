import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface StudentStatsView {
  readonly totalStudents: number;
  readonly maleStudents: number;
  readonly femaleStudents: number;
  readonly averageAge: number;
  readonly oldestBirthDate: string;
  readonly youngestBirthDate: string;
  readonly averageScore: number;
  readonly passRate: number;
  readonly excellentRate: number;
  readonly gradeDistribution: Record<string, number>;
}

@Component({
  selector: 'app-student-stats',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './student-stats.component.html',
  styleUrl: './student-stats.component.scss',
})
export class StudentStatsComponent {
  readonly stats = input.required<StudentStatsView>();
}
