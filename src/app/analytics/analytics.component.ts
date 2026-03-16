import { Component, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import { scoreToGrade, isPassingScore } from '../core/utils/score-grade.util';
import { BarChartComponent, DonutChartComponent } from '../shared/components/charts';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PageHeroComponent, BarChartComponent, DonutChartComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly enrollmentStore: EnrollmentStoreService,
    private readonly teacherStore: TeacherStoreService,
  ) {}

  // Overall metrics
  readonly totalCourses = computed(() => this.courseStore.courses().length);
  readonly totalStudents = computed(() => this.studentStore.students().length);
  readonly totalTeachers = computed(() => this.teacherStore.teachers().length);
  readonly totalEnrollments = computed(() => this.enrollmentStore.enrollments().length);

  readonly avgProgress = computed(() => {
    const courses = this.courseStore.courses();
    if (courses.length === 0) return 0;
    return Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length);
  });

  readonly avgScore = computed(() => {
    const students = this.studentStore.students();
    if (students.length === 0) return 0;
    return Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length * 10) / 10;
  });

  readonly passRate = computed(() => {
    const students = this.studentStore.students();
    if (students.length === 0) return 0;
    return Math.round(students.filter(s => isPassingScore(s.score)).length / students.length * 100);
  });

  readonly completionRate = computed(() => {
    const courses = this.courseStore.courses();
    if (courses.length === 0) return 0;
    return Math.round(courses.filter(c => c.status === 'completed').length / courses.length * 100);
  });

  // Teacher workload
  readonly teacherWorkload = computed(() => {
    const courses = this.courseStore.courses();
    const workload = new Map<string, number>();
    for (const c of courses) {
      workload.set(c.instructor, (workload.get(c.instructor) ?? 0) + 1);
    }
    return Array.from(workload.entries())
      .map(([name, count]) => ({ label: name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  });

  // Course progress ranking
  readonly courseRanking = computed(() => {
    return this.courseStore.courses()
      .filter(c => c.status !== 'planned')
      .map(c => ({ label: c.name.length > 8 ? c.name.slice(0, 8) + '…' : c.name, value: c.progress }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  });

  // Grade distribution
  readonly gradeDistribution = computed(() => {
    const students = this.studentStore.students();
    const grades = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    for (const s of students) {
      const g = scoreToGrade(s.score) as keyof typeof grades;
      if (g in grades) grades[g]++;
    }
    return [
      { label: 'A (90+)', value: grades.A, color: '#10b981' },
      { label: 'B (80-89)', value: grades.B, color: '#4F46E5' },
      { label: 'C (70-79)', value: grades.C, color: '#f59e0b' },
      { label: 'D (60-69)', value: grades.D, color: '#f97316' },
      { label: 'E/F (<60)', value: grades.E + grades.F, color: '#e5484d' },
    ];
  });

  // Course status distribution
  readonly courseStatus = computed(() => {
    const courses = this.courseStore.courses();
    const active = courses.filter(c => c.status === 'active').length;
    const notStarted = courses.filter(c => c.status === 'planned').length;
    const completed = courses.filter(c => c.status === 'completed').length;
    return [
      { label: '进行中', value: active, color: '#4F46E5' },
      { label: '未开始', value: notStarted, color: '#f59e0b' },
      { label: '已结课', value: completed, color: '#10b981' },
    ];
  });

  // Top students
  readonly topStudents = computed(() => {
    return this.studentStore.students()
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => ({
        name: s.name,
        studentNo: s.studentNo,
        score: s.score,
        grade: scoreToGrade(s.score),
      }));
  });

  // Score distribution for bar chart
  readonly scoreDistribution = computed(() => {
    const students = this.studentStore.students();
    const ranges = [
      { label: '0-29', min: 0, max: 29, count: 0 },
      { label: '30-59', min: 30, max: 59, count: 0 },
      { label: '60-69', min: 60, max: 69, count: 0 },
      { label: '70-79', min: 70, max: 79, count: 0 },
      { label: '80-89', min: 80, max: 89, count: 0 },
      { label: '90-100', min: 90, max: 100, count: 0 },
    ];
    for (const s of students) {
      for (const r of ranges) {
        if (s.score >= r.min && s.score <= r.max) { r.count++; break; }
      }
    }
    return ranges.map(r => ({ label: r.label, value: r.count }));
  });

  // Gender distribution
  readonly genderDistribution = computed(() => {
    const students = this.studentStore.students();
    const male = students.filter(s => s.gender === 'male').length;
    const female = students.filter(s => s.gender === 'female').length;
    return [
      { label: '男生', value: male, color: '#4F46E5' },
      { label: '女生', value: female, color: '#ec4899' },
    ];
  });
}
