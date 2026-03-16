import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { calculateAgeFromBirthDate } from '../core/utils/date-age.util';
import { scoreToGrade, GRADE_ORDER, GRADE_LABELS, isPassingScore } from '../core/utils/score-grade.util';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { BarChartComponent, DonutChartComponent, LineChartComponent, ChartDataItem } from '../shared/components/charts';

interface ReportBarItem {
  readonly label: string;
  readonly value: number;
  readonly suffix?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatIconModule, PageHeroComponent, BarChartComponent, DonutChartComponent, LineChartComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  readonly courses = this.courseStore.courses;
  readonly students = this.studentStore.students;

  readonly topProgressCourses = computed<readonly ReportBarItem[]>(() =>
    [...this.courses()]
      .sort((firstCourse, secondCourse) => secondCourse.progress - firstCourse.progress)
      .slice(0, 5)
      .map(course => ({
        label: course.name,
        value: course.progress,
        suffix: '%',
      })),
  );

  readonly instructorLoads = computed<readonly ReportBarItem[]>(() =>
    [...this.courses()]
      .map(course => ({
        label: course.instructor,
        value: course.students,
        suffix: '人',
      }))
      .sort((firstLoad, secondLoad) => secondLoad.value - firstLoad.value),
  );

  readonly genderDistribution = computed<readonly ReportBarItem[]>(() => {
    const studentList = this.students();
    const maleCount = studentList.filter(student => student.gender === 'male').length;
    const femaleCount = studentList.length - maleCount;

    return [
      { label: '男生', value: maleCount, suffix: '人' },
      { label: '女生', value: femaleCount, suffix: '人' },
    ];
  });

  readonly ageDistribution = computed<readonly ReportBarItem[]>(() => {
    const buckets = new Map<string, number>([
      ['17 岁及以下', 0],
      ['18 岁', 0],
      ['19 岁', 0],
      ['20 岁及以上', 0],
    ]);

    for (const student of this.students()) {
      const age = calculateAgeFromBirthDate(student.birthDate);
      if (age <= 17) {
        buckets.set('17 岁及以下', (buckets.get('17 岁及以下') ?? 0) + 1);
      } else if (age === 18) {
        buckets.set('18 岁', (buckets.get('18 岁') ?? 0) + 1);
      } else if (age === 19) {
        buckets.set('19 岁', (buckets.get('19 岁') ?? 0) + 1);
      } else {
        buckets.set('20 岁及以上', (buckets.get('20 岁及以上') ?? 0) + 1);
      }
    }

    return [...buckets.entries()].map(([label, value]) => ({ label, value, suffix: '人' }));
  });

  readonly reportSummary = computed(() => {
    const courseList = this.courses();
    const studentList = this.students();
    const averageProgress =
      courseList.length > 0
        ? Math.round(
            courseList.reduce((progress, course) => progress + course.progress, 0) / courseList.length,
          )
        : 0;
    const averageCourseSize =
      courseList.length > 0
        ? Math.round(courseList.reduce((total, course) => total + course.students, 0) / courseList.length)
        : 0;
    const averageAge =
      studentList.length > 0
        ? Math.round(
            studentList.reduce((total, student) => total + calculateAgeFromBirthDate(student.birthDate), 0) /
              studentList.length,
          )
        : 0;

    const averageScore =
      studentList.length > 0
        ? Math.round(
            studentList.reduce((total, student) => total + student.score, 0) / studentList.length,
          )
        : 0;

    const passRate =
      studentList.length > 0
        ? Math.round(
            (studentList.filter(s => isPassingScore(s.score)).length / studentList.length) * 100,
          )
        : 0;

    return [
      { label: '平均课程进度', value: `${averageProgress}%`, icon: 'show_chart' },
      { label: '平均班级规模', value: `${averageCourseSize} 人`, icon: 'diversity_3' },
      { label: '学生平均年龄', value: `${averageAge} 岁`, icon: 'cake' },
      { label: '全员平均分', value: `${averageScore} 分`, icon: 'insights' },
      { label: '及格率', value: `${passRate}%`, icon: 'verified' },
    ];
  });

  readonly gradeDistribution = computed<readonly ReportBarItem[]>(() => {
    const studentList = this.students();
    const counts: Record<string, number> = {};
    for (const grade of GRADE_ORDER) {
      counts[grade] = 0;
    }
    for (const student of studentList) {
      const grade = scoreToGrade(student.score);
      counts[grade] = (counts[grade] ?? 0) + 1;
    }
    return GRADE_ORDER.map(grade => ({
      label: `${grade} - ${GRADE_LABELS[grade]}`,
      value: counts[grade] ?? 0,
      suffix: '人',
    }));
  });

  readonly scoreRangeDistribution = computed<readonly ReportBarItem[]>(() => {
    const ranges = [
      { label: '90-100 分', min: 90, max: 100 },
      { label: '80-89 分', min: 80, max: 89 },
      { label: '70-79 分', min: 70, max: 79 },
      { label: '60-69 分', min: 60, max: 69 },
      { label: '60 分以下', min: 0, max: 59 },
    ];
    const studentList = this.students();
    return ranges.map(range => ({
      label: range.label,
      value: studentList.filter(s => s.score >= range.min && s.score <= range.max).length,
      suffix: '人',
    }));
  });

  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
  ) {}

  readonly activeTab = signal<'overview' | 'courses' | 'students'>('overview');

  readonly gradeChartData = computed<readonly ChartDataItem[]>(() => {
    const gradeColors: Record<string, string> = {
      A: '#10b981', B: '#4F46E5', C: '#f59e0b', D: '#f97316', E: '#ef4444', F: '#dc2626',
    };
    const studentList = this.students();
    const counts: Record<string, number> = {};
    for (const g of GRADE_ORDER) counts[g] = 0;
    for (const s of studentList) {
      const g = scoreToGrade(s.score);
      counts[g] = (counts[g] ?? 0) + 1;
    }
    return GRADE_ORDER.map(g => ({
      label: `${g} ${GRADE_LABELS[g]}`,
      value: counts[g] ?? 0,
      color: gradeColors[g] ?? '#94a3b8',
    }));
  });

  readonly courseStatusChart = computed<readonly ChartDataItem[]>(() => {
    const courseList = this.courses();
    return [
      { label: '进行中', value: courseList.filter(c => c.status === 'active').length, color: '#4F46E5' },
      { label: '未开始', value: courseList.filter(c => c.status === 'planned').length, color: '#f59e0b' },
      { label: '已结课', value: courseList.filter(c => c.status === 'completed').length, color: '#10b981' },
    ];
  });

  readonly scoreLineData = computed<readonly ChartDataItem[]>(() => {
    const ranges = [
      { label: '90+', min: 90, max: 100 },
      { label: '80-89', min: 80, max: 89 },
      { label: '70-79', min: 70, max: 79 },
      { label: '60-69', min: 60, max: 69 },
      { label: '<60', min: 0, max: 59 },
    ];
    const studentList = this.students();
    return ranges.map(r => ({
      label: r.label,
      value: studentList.filter(s => s.score >= r.min && s.score <= r.max).length,
    }));
  });

  readonly genderDonut = computed<readonly ChartDataItem[]>(() => {
    const studentList = this.students();
    return [
      { label: '男生', value: studentList.filter(s => s.gender === 'male').length, color: '#4F46E5' },
      { label: '女生', value: studentList.filter(s => s.gender === 'female').length, color: '#ec4899' },
    ];
  });

  readonly progressBarData = computed<readonly ChartDataItem[]>(() =>
    [...this.courses()]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 8)
      .map(c => ({ label: c.name, value: c.progress, color: '#4F46E5' })),
  );

  barWidth(items: readonly ReportBarItem[], itemValue: number): string {
    const maxValue = Math.max(...items.map(item => item.value), 1);
    return `${Math.round((itemValue / maxValue) * 100)}%`;
  }
}
