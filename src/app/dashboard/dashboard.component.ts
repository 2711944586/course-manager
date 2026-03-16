import { DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { isPassingScore, scoreToGrade, GRADE_ORDER, GRADE_LABELS } from '../core/utils/score-grade.util';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { BarChartComponent, DonutChartComponent, LineChartComponent, ChartDataItem } from '../shared/components/charts';

interface DashboardMetric {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly icon: string;
}

interface DashboardAlert {
  readonly title: string;
  readonly text: string;
  readonly icon: string;
  readonly tone: 'warning' | 'info' | 'success';
}

interface DashboardQuickAction {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly route: string;
  readonly queryParams?: Record<string, string>;
  readonly tone: 'primary' | 'secondary';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, MatRippleModule, MatIconModule, PageHeroComponent, BarChartComponent, DonutChartComponent, LineChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly courses = this.courseStore.courses;
  readonly students = this.studentStore.students;
  readonly quickActions: readonly DashboardQuickAction[] = [
    {
      label: '新建课程',
      description: '快速进入课程创建表单，适合日常录入新课。',
      icon: 'add',
      route: '/courses/create',
      tone: 'primary',
    },
    {
      label: '新建学生',
      description: '直接打开学生录入面板，减少页面切换成本。',
      icon: 'person_add',
      route: '/students/create',
      tone: 'secondary',
    },
    {
      label: '查看教务日程',
      description: '按工作周巡检排课分布和重点提醒。',
      icon: 'calendar_month',
      route: '/schedule',
      tone: 'secondary',
    },
    {
      label: '查看数据报表',
      description: '快速进入课程进度、年龄与负载分析视图。',
      icon: 'insights',
      route: '/reports',
      tone: 'secondary',
    },
  ];

  readonly metrics = computed<readonly DashboardMetric[]>(() => {
    const courseList = this.courses();
    const studentList = this.students();
    const averageProgress =
      courseList.length > 0
        ? Math.round(
            courseList.reduce((totalProgress, course) => totalProgress + course.progress, 0) /
              courseList.length,
          )
        : 0;
    const completionRate =
      courseList.length > 0
        ? Math.round(
            (courseList.filter(course => course.status === 'completed').length / courseList.length) * 100,
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
      {
        label: '课程总量',
        value: `${courseList.length}`,
        helper: '当前课程库中的全部课程',
        icon: 'menu_book',
      },
      {
        label: '学生总量',
        value: `${studentList.length}`,
        helper: '已录入学生档案数量',
        icon: 'groups',
      },
      {
        label: '平均进度',
        value: `${averageProgress}%`,
        helper: '全部课程的平均教学进展',
        icon: 'trending_up',
      },
      {
        label: '结课率',
        value: `${completionRate}%`,
        helper: '已结课课程占全部课程比例',
        icon: 'task_alt',
      },
      {
        label: '全员平均分',
        value: `${averageScore}`,
        helper: '全体学生的综合平均成绩',
        icon: 'insights',
      },
      {
        label: '及格率',
        value: `${passRate}%`,
        helper: '成绩 ≥ 60 分的学生占比',
        icon: 'verified',
      },
    ];
  });

  readonly highlightedCourses = computed(() =>
    [...this.courses()]
      .sort((firstCourse, secondCourse) => secondCourse.students - firstCourse.students)
      .slice(0, 5),
  );

  readonly recentActivities = computed(() => {
    const recentCourses = this.courses().slice(0, 3).map(course => ({
      type: '课程更新',
      title: course.name,
      description: `${course.instructor} · ${course.schedule}`,
      timestamp: course.updatedAt,
      icon: course.icon,
    }));

    const recentStudents = this.students().slice(0, 3).map(student => ({
      type: '学生更新',
      title: student.name,
      description: `学号 ${student.studentNo}`,
      timestamp: student.updatedAt,
      icon: 'person',
    }));

    return [...recentCourses, ...recentStudents]
      .sort((firstItem, secondItem) => new Date(secondItem.timestamp).getTime() - new Date(firstItem.timestamp).getTime())
      .slice(0, 6);
  });

  readonly alerts = computed<readonly DashboardAlert[]>(() => {
    const courseList = this.courses();
    const activeCourses = courseList.filter(course => course.status === 'active');
    const plannedCourses = courseList.filter(course => course.status === 'planned');
    const heavyCourses = courseList.filter(course => course.students >= 150);
    const nearCompletionCourses = courseList.filter(
      course => course.status === 'active' && course.progress >= 80,
    );

    return [
      {
        title: '待开课课程',
        text:
          plannedCourses.length > 0
            ? `当前还有 ${plannedCourses.length} 门课程未开始，建议尽快确认排课与教师安排。`
            : '所有课程都已经进入教学流程，没有待开课积压。',
        icon: 'event_available',
        tone: plannedCourses.length > 0 ? 'warning' : 'success',
      },
      {
        title: '高负载课程',
        text:
          heavyCourses.length > 0
            ? `${heavyCourses[0]?.name ?? '重点课程'} 等 ${heavyCourses.length} 门课程学生数较高，建议关注助教与答疑资源。`
            : '当前没有超大班课程，容量分布较均衡。',
        icon: 'local_fire_department',
        tone: heavyCourses.length > 0 ? 'warning' : 'info',
      },
      {
        title: '近期可结课',
        text:
          nearCompletionCourses.length > 0
            ? `${nearCompletionCourses.map(course => course.name).slice(0, 2).join('、')} 进度已接近结课。`
            : `${activeCourses.length} 门进行中课程仍在稳定推进。`,
        icon: 'flag',
        tone: nearCompletionCourses.length > 0 ? 'info' : 'success',
      },
    ];
  });

  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
  ) {}

  readonly courseStatusChart = computed<readonly ChartDataItem[]>(() => {
    const courseList = this.courses();
    return [
      { label: '进行中', value: courseList.filter(c => c.status === 'active').length, color: '#0070f3' },
      { label: '未开始', value: courseList.filter(c => c.status === 'planned').length, color: '#f5a623' },
      { label: '已结课', value: courseList.filter(c => c.status === 'completed').length, color: '#0ea371' },
    ];
  });

  readonly gradeChart = computed<readonly ChartDataItem[]>(() => {
    const studentList = this.students();
    const gradeColors: Record<string, string> = {
      A: '#0ea371', B: '#0070f3', C: '#f5a623', D: '#f97316', E: '#ef4444', F: '#dc2626',
    };
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

  readonly scoreRangeChart = computed<readonly ChartDataItem[]>(() => {
    const ranges = [
      { label: '90+', min: 90, max: 100, color: '#0ea371' },
      { label: '80-89', min: 80, max: 89, color: '#0070f3' },
      { label: '70-79', min: 70, max: 79, color: '#7c66dc' },
      { label: '60-69', min: 60, max: 69, color: '#f59e0b' },
      { label: '<60', min: 0, max: 59, color: '#ef4444' },
    ];
    const studentList = this.students();
    return ranges.map(r => ({
      label: r.label,
      value: studentList.filter(s => s.score >= r.min && s.score <= r.max).length,
      color: r.color,
    }));
  });
}
