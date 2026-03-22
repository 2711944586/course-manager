import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import { scoreToGrade, isPassingScore } from '../core/utils/score-grade.util';
import { BarChartComponent, DonutChartComponent } from '../shared/components/charts';
import { InsightEngineService } from '../core/services/insight-engine.service';
import { AiInsightService } from '../core/services/ai-insight.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    PageHeroComponent,
    BarChartComponent,
    DonutChartComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  readonly activeTab = signal<'overview' | 'compare' | 'intelligence'>('overview');
  readonly snapshot = this.insightEngine.snapshot;
  readonly aiStatus = this.aiInsights.status;
  readonly aiStatusLabel = this.aiInsights.statusLabel;
  readonly aiSummaryCards = this.aiInsights.summaryCards;
  readonly aiSuggestedActions = this.aiInsights.suggestedActions;
  readonly aiBaselineComparisons = this.aiInsights.baselineComparisons;

  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly enrollmentStore: EnrollmentStoreService,
    private readonly teacherStore: TeacherStoreService,
    private readonly insightEngine: InsightEngineService,
    private readonly aiInsights: AiInsightService,
  ) {}

  readonly totalCourses = computed(() => this.courseStore.courses().length);
  readonly totalStudents = computed(() => this.studentStore.students().length);
  readonly totalTeachers = computed(() => this.teacherStore.teachers().length);
  readonly totalEnrollments = computed(() => this.enrollmentStore.enrollments().length);

  readonly avgProgress = computed(() => this.snapshot().avgProgress);
  readonly avgScore = computed(() => this.snapshot().avgScore);
  readonly passRate = computed(() => this.snapshot().passRate);
  readonly completionRate = computed(() => this.snapshot().completionRate);

  readonly teacherWorkload = computed(() => {
    const courses = this.courseStore.courses();
    const workload = new Map<string, number>();
    for (const course of courses) {
      workload.set(course.instructor, (workload.get(course.instructor) ?? 0) + 1);
    }
    return Array.from(workload.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  });

  readonly courseRanking = computed(() =>
    this.courseStore.courses()
      .filter(course => course.status !== 'planned')
      .map(course => ({ label: course.name.length > 8 ? `${course.name.slice(0, 8)}…` : course.name, value: course.progress }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  );

  readonly gradeDistribution = computed(() => {
    const students = this.studentStore.students();
    const grades = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    for (const student of students) {
      const grade = scoreToGrade(student.score) as keyof typeof grades;
      if (grade in grades) {
        grades[grade] += 1;
      }
    }
    return [
      { label: 'A (90+)', value: grades.A, color: 'var(--chart-emerald, #34D399)' },
      { label: 'B (80-89)', value: grades.B, color: 'var(--chart-blue, #60A5FA)' },
      { label: 'C (70-79)', value: grades.C, color: 'var(--chart-indigo, #5EEAD4)' },
      { label: 'D (60-69)', value: grades.D, color: 'var(--chart-amber, #F59E0B)' },
      { label: 'E/F (<60)', value: grades.E + grades.F, color: 'var(--chart-red, #FB7185)' },
    ];
  });

  readonly courseStatus = computed(() => {
    const courses = this.courseStore.courses();
    return [
      { label: '进行中', value: courses.filter(course => course.status === 'active').length, color: 'var(--chart-indigo, #5EEAD4)' },
      { label: '未开始', value: courses.filter(course => course.status === 'planned').length, color: 'var(--chart-amber, #F59E0B)' },
      { label: '已结课', value: courses.filter(course => course.status === 'completed').length, color: 'var(--chart-emerald, #34D399)' },
    ];
  });

  readonly topStudents = computed(() =>
    this.studentStore.students()
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(student => ({
        name: student.name,
        studentNo: student.studentNo,
        score: student.score,
        grade: scoreToGrade(student.score),
      })),
  );

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
    for (const student of students) {
      for (const range of ranges) {
        if (student.score >= range.min && student.score <= range.max) {
          range.count += 1;
          break;
        }
      }
    }
    return ranges.map(range => ({ label: range.label, value: range.count }));
  });

  readonly genderDistribution = computed(() => {
    const students = this.studentStore.students();
    const male = students.filter(student => student.gender === 'male').length;
    const female = students.filter(student => student.gender === 'female').length;
    return [
      { label: '男生', value: male, color: 'var(--chart-blue, #60A5FA)' },
      { label: '女生', value: female, color: 'var(--chart-pink, #F472B6)' },
    ];
  });

  readonly compareHighlights = computed(() => [
    {
      label: '高风险课程',
      value: this.snapshot().highRiskCourses.length,
      helper: '需优先检查大班低进度和久未更新课程',
      icon: 'priority_high',
    },
    {
      label: '重点学生',
      value: this.snapshot().highRiskStudents.length,
      helper: '需跟进低分与临界学生群体',
      icon: 'person_search',
    },
    {
      label: '通过率观察',
      value: `${this.passRate()}%`,
      helper: this.passRate() >= 85 ? '成绩结构稳定' : '建议关注低分层',
      icon: 'monitoring',
    },
  ]);

  readonly passBand = computed(() => {
    const students = this.studentStore.students();
    const passing = students.filter(student => isPassingScore(student.score)).length;
    const failing = students.length - passing;
    return [
      { label: '及格', value: passing, color: 'var(--chart-emerald, #34D399)' },
      { label: '未及格', value: failing, color: 'var(--chart-red, #FB7185)' },
    ];
  });
}
