import { DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { ActivityLogService } from '../core/services/activity-log.service';
import { RecentWorkspaceService } from '../core/services/recent-workspace.service';
import { InsightEngineService } from '../core/services/insight-engine.service';
import { scoreToGrade, GRADE_ORDER, GRADE_LABELS } from '../core/utils/score-grade.util';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { BarChartComponent, DonutChartComponent, LineChartComponent, ChartDataItem } from '../shared/components/charts';

interface DashboardMetric {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly icon: string;
  readonly tone: 'primary' | 'secondary' | 'success' | 'warning';
  readonly trend: string;
}

interface DashboardQuickAction {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly route: string;
  readonly tone: 'primary' | 'secondary';
}

interface TimelineEntry {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly timestamp: string;
  readonly icon: string;
  readonly tone: 'insight' | 'activity';
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
  readonly snapshot = this.insightEngine.snapshot;
  readonly recentWorkspace = this.workspace.items;

  readonly quickActions: readonly DashboardQuickAction[] = [
    {
      label: '新建课程',
      description: '快速补录新课程并进入深度编辑页。',
      icon: 'add_circle',
      route: '/courses/create',
      tone: 'primary',
    },
    {
      label: '新建学生',
      description: '立刻进入学生建档流程，保留现有深链路。',
      icon: 'person_add',
      route: '/students/create',
      tone: 'primary',
    },
    {
      label: '进入智能洞察',
      description: '查看对比、趋势与 AI 预留摘要。',
      icon: 'auto_awesome',
      route: '/analytics',
      tone: 'secondary',
    },
    {
      label: '打开报表中心',
      description: '继续查看课程进度、成绩段与结构分析。',
      icon: 'insights',
      route: '/reports',
      tone: 'secondary',
    },
  ];

  readonly metrics = computed<readonly DashboardMetric[]>(() => {
    const snapshot = this.snapshot();

    return [
      {
        label: '课程总量',
        value: `${snapshot.totalCourses}`,
        helper: '当前课程库中的全部课程',
        icon: 'menu_book',
        tone: 'primary',
        trend: `${snapshot.activeCourses} 门进行中`,
      },
      {
        label: '学生总量',
        value: `${snapshot.totalStudents}`,
        helper: '已录入学生档案总量',
        icon: 'groups',
        tone: 'secondary',
        trend: `${snapshot.passRate}% 及格率`,
      },
      {
        label: '平均进度',
        value: `${snapshot.avgProgress}%`,
        helper: '衡量教学推进是否掉速',
        icon: 'trending_up',
        tone: snapshot.avgProgress >= 70 ? 'success' : 'warning',
        trend: `${snapshot.completionRate}% 结课率`,
      },
      {
        label: '全员均分',
        value: `${snapshot.avgScore}`,
        helper: '综合反映课程与学生表现',
        icon: 'grade',
        tone: snapshot.avgScore >= 80 ? 'success' : 'warning',
        trend: `${snapshot.highRiskStudents.length} 名重点学生`,
      },
    ];
  });

  readonly chartSummary = computed(() => ({
    risks: this.snapshot().risks.slice(0, 4),
    recommendations: this.snapshot().recommendations.slice(0, 4),
    workspace: this.recentWorkspace().slice(0, 4),
  }));

  readonly operationsTimeline = computed<readonly TimelineEntry[]>(() => {
    const insightItems = this.snapshot().risks.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      detail: item.summary,
      timestamp: this.snapshot().generatedAt,
      icon: item.icon,
      tone: 'insight' as const,
    }));
    const activityItems = this.activityLog.recentEntries().slice(0, 5).map(entry => ({
      id: `activity-${entry.id}`,
      title: entry.entityName,
      detail: entry.detail,
      timestamp: entry.timestamp,
      icon: entry.entity === 'student' ? 'person' : entry.entity === 'course' ? 'menu_book' : 'history',
      tone: 'activity' as const,
    }));

    return [...insightItems, ...activityItems]
      .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
      .slice(0, 8);
  });

  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
    private readonly insightEngine: InsightEngineService,
    private readonly activityLog: ActivityLogService,
    private readonly workspace: RecentWorkspaceService,
  ) {}

  readonly courseStatusChart = computed<readonly ChartDataItem[]>(() => {
    const courseList = this.courses();
    return [
      { label: '进行中', value: courseList.filter(c => c.status === 'active').length, color: 'var(--chart-indigo, #5EEAD4)' },
      { label: '未开始', value: courseList.filter(c => c.status === 'planned').length, color: 'var(--chart-amber, #F59E0B)' },
      { label: '已结课', value: courseList.filter(c => c.status === 'completed').length, color: 'var(--chart-emerald, #34D399)' },
    ];
  });

  readonly gradeChart = computed<readonly ChartDataItem[]>(() => {
    const studentList = this.students();
    const gradeColors: Record<string, string> = {
      A: 'var(--chart-emerald, #34D399)',
      B: 'var(--chart-indigo, #5EEAD4)',
      C: 'var(--chart-blue, #60A5FA)',
      D: 'var(--chart-amber, #F59E0B)',
      E: 'var(--chart-red, #FB7185)',
      F: 'var(--chart-red, #FB7185)',
    };
    const counts: Record<string, number> = {};
    for (const grade of GRADE_ORDER) {
      counts[grade] = 0;
    }
    for (const student of studentList) {
      const grade = scoreToGrade(student.score);
      counts[grade] = (counts[grade] ?? 0) + 1;
    }
    return GRADE_ORDER.map(grade => ({
      label: `${grade} ${GRADE_LABELS[grade]}`,
      value: counts[grade] ?? 0,
      color: gradeColors[grade] ?? 'var(--text-tertiary)',
    }));
  });

  readonly scoreRangeChart = computed<readonly ChartDataItem[]>(() => {
    const ranges = [
      { label: '90+', min: 90, max: 100, color: 'var(--chart-emerald, #34D399)' },
      { label: '80-89', min: 80, max: 89, color: 'var(--chart-blue, #60A5FA)' },
      { label: '70-79', min: 70, max: 79, color: 'var(--chart-indigo, #5EEAD4)' },
      { label: '60-69', min: 60, max: 69, color: 'var(--chart-amber, #F59E0B)' },
      { label: '<60', min: 0, max: 59, color: 'var(--chart-red, #FB7185)' },
    ];
    const studentList = this.students();
    return ranges.map(range => ({
      label: range.label,
      value: studentList.filter(student => student.score >= range.min && student.score <= range.max).length,
      color: range.color,
    }));
  });
}
