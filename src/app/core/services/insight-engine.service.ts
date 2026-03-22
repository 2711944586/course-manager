import { Injectable, computed } from '@angular/core';
import { CourseStoreService } from './course-store.service';
import { StudentStoreService } from './student-store.service';
import {
  InsightAction,
  InsightCard,
  InsightSnapshot,
  RiskTarget,
  type InsightSeverity,
} from '../models/insight.model';

@Injectable({ providedIn: 'root' })
export class InsightEngineService {
  readonly snapshot = computed<InsightSnapshot>(() => {
    const courseList = this.courseStore.courses();
    const studentList = this.studentStore.students();
    const avgProgress =
      courseList.length > 0
        ? Math.round(courseList.reduce((sum, course) => sum + course.progress, 0) / courseList.length)
        : 0;
    const avgScore =
      studentList.length > 0
        ? Math.round(studentList.reduce((sum, student) => sum + student.score, 0) / studentList.length)
        : 0;
    const passRate =
      studentList.length > 0
        ? Math.round((studentList.filter(student => student.score >= 60).length / studentList.length) * 100)
        : 0;
    const activeCourses = courseList.filter(course => course.status === 'active').length;
    const plannedCourses = courseList.filter(course => course.status === 'planned').length;
    const completedCourses = courseList.filter(course => course.status === 'completed').length;
    const completionRate =
      courseList.length > 0 ? Math.round((completedCourses / courseList.length) * 100) : 0;

    const highRiskCourses = this.buildCourseRisks(avgProgress);
    const highRiskStudents = this.buildStudentRisks(avgScore);
    const risks = this.buildRiskCards(highRiskCourses, highRiskStudents);
    const trends = this.buildTrendCards({
      avgProgress,
      avgScore,
      passRate,
      completionRate,
      plannedCourses,
      activeCourses,
      completedCourses,
    });
    const comparisons = this.buildComparisonCards({
      avgProgress,
      avgScore,
      passRate,
      completionRate,
      totalCourses: courseList.length,
      totalStudents: studentList.length,
    });
    const recommendations = this.buildRecommendations({
      highRiskCourses,
      highRiskStudents,
      plannedCourses,
      passRate,
      completionRate,
    });

    return {
      generatedAt: new Date().toISOString(),
      totalCourses: courseList.length,
      totalStudents: studentList.length,
      avgProgress,
      avgScore,
      passRate,
      completionRate,
      activeCourses,
      plannedCourses,
      completedCourses,
      highRiskCourses,
      highRiskStudents,
      risks,
      trends,
      comparisons,
      recommendations,
    };
  });

  readonly missionSummary = computed(() => {
    const snapshot = this.snapshot();
    if (snapshot.highRiskCourses.length > 0 || snapshot.highRiskStudents.length > 0) {
      return `当前识别出 ${snapshot.highRiskCourses.length + snapshot.highRiskStudents.length} 个需优先处理的高风险对象。`;
    }

    if (snapshot.passRate >= 85 && snapshot.completionRate >= 50) {
      return '教学运营状态稳定，当前可优先推进分析与优化动作。';
    }

    return '当前无严重阻断，但存在若干需要持续观察的课程与成绩风险。';
  });

  constructor(
    private readonly courseStore: CourseStoreService,
    private readonly studentStore: StudentStoreService,
  ) {}

  createTargetBaseline(): InsightSnapshot {
    const snapshot = this.snapshot();

    return {
      ...snapshot,
      generatedAt: snapshot.generatedAt,
      avgProgress: 72,
      avgScore: 82,
      passRate: 88,
      completionRate: 60,
      highRiskCourses: [],
      highRiskStudents: [],
      risks: [],
      trends: [],
      comparisons: [],
      recommendations: [],
    };
  }

  private buildCourseRisks(avgProgress: number): readonly RiskTarget[] {
    const targets: RiskTarget[] = [];

    for (const course of this.courseStore.courses()) {
        const lastUpdatedDays = this.daysSince(course.updatedAt);
        let severity: InsightSeverity | null = null;
        let summary = '';

        if (course.students >= 150 && course.progress <= Math.max(20, avgProgress - 35)) {
          severity = 'critical';
          summary = `大班课程但进度仅 ${course.progress}%，建议立即检查排课与授课节奏。`;
        } else if (course.status === 'planned' && course.students >= 90) {
          severity = 'risk';
          summary = `已有 ${course.students} 名学生，但课程仍未启动。`;
        } else if (lastUpdatedDays >= 12 && course.status !== 'completed') {
          severity = 'watch';
          summary = `已 ${lastUpdatedDays} 天未更新，可能存在状态滞后。`;
        }

        if (!severity) {
          continue;
        }

        targets.push({
          id: course.id,
          title: course.name,
          summary,
          severity,
          route: `/courses/detail/${course.id}`,
          icon: course.icon,
        });
      }

    return targets.slice(0, 4);
  }

  private buildStudentRisks(avgScore: number): readonly RiskTarget[] {
    const targets: RiskTarget[] = [];

    for (const student of this.studentStore.students()) {
        let severity: InsightSeverity | null = null;
        let summary = '';

        if (student.score < 45) {
          severity = 'critical';
          summary = `当前成绩 ${student.score}，已明显低于安全线。`;
        } else if (student.score < 60) {
          severity = 'risk';
          summary = `当前成绩 ${student.score}，处于不及格区间。`;
        } else if (student.score <= Math.max(65, avgScore - 18)) {
          severity = 'watch';
          summary = `当前成绩 ${student.score}，显著低于整体均值 ${avgScore}。`;
        }

        if (!severity) {
          continue;
        }

        targets.push({
          id: student.id,
          title: student.name,
          summary,
          severity,
          route: `/students/detail/${student.id}`,
          icon: 'person',
        });
      }

    return targets
      .sort((first, second) => this.severityWeight(second.severity) - this.severityWeight(first.severity))
      .slice(0, 4);
  }

  private buildRiskCards(
    highRiskCourses: readonly RiskTarget[],
    highRiskStudents: readonly RiskTarget[],
  ): readonly InsightCard[] {
    return [...highRiskCourses, ...highRiskStudents]
      .map<InsightCard>(item => ({
        id: `risk-${item.route}`,
        kind: 'risk',
        severity: item.severity,
        title: item.title,
        summary: item.summary,
        metric: item.severity === 'critical' ? '立即处理' : item.severity === 'risk' ? '优先关注' : '建议跟进',
        icon: item.icon,
        route: item.route,
      }))
      .slice(0, 6);
  }

  private buildTrendCards(metrics: {
    avgProgress: number;
    avgScore: number;
    passRate: number;
    completionRate: number;
    plannedCourses: number;
    activeCourses: number;
    completedCourses: number;
  }): readonly InsightCard[] {
    return [
      {
        id: 'trend-progress',
        kind: 'trend',
        severity: metrics.avgProgress >= 70 ? 'info' : metrics.avgProgress >= 50 ? 'watch' : 'risk',
        title: '课程推进节奏',
        summary:
          metrics.avgProgress >= 70
            ? `平均进度 ${metrics.avgProgress}%，当前推进节奏稳定。`
            : `平均进度 ${metrics.avgProgress}%，应关注推进较慢的课程组。`,
        metric: `${metrics.avgProgress}%`,
        icon: 'trending_up',
        route: '/reports',
      },
      {
        id: 'trend-pass-rate',
        kind: 'trend',
        severity: metrics.passRate >= 85 ? 'info' : metrics.passRate >= 70 ? 'watch' : 'risk',
        title: '成绩安全线',
        summary:
          metrics.passRate >= 85
            ? `当前及格率 ${metrics.passRate}%，整体表现健康。`
            : `当前及格率 ${metrics.passRate}%，建议重点回看低分学生。`,
        metric: `${metrics.passRate}%`,
        icon: 'monitoring',
        route: '/analytics',
      },
      {
        id: 'trend-course-state',
        kind: 'trend',
        severity: metrics.plannedCourses > 2 ? 'watch' : 'info',
        title: '课程状态分层',
        summary: `进行中 ${metrics.activeCourses} 门，已结课 ${metrics.completedCourses} 门，待启动 ${metrics.plannedCourses} 门。`,
        metric: `${metrics.completedCourses}/${metrics.activeCourses + metrics.completedCourses}`,
        icon: 'splitscreen',
        route: '/courses',
      },
      {
        id: 'trend-score-band',
        kind: 'trend',
        severity: metrics.avgScore >= 80 ? 'info' : metrics.avgScore >= 68 ? 'watch' : 'risk',
        title: '均分表现',
        summary: `全员均分 ${metrics.avgScore}，可作为当前成绩结构的核心观察值。`,
        metric: `${metrics.avgScore}`,
        icon: 'grade',
        route: '/students',
      },
    ];
  }

  private buildComparisonCards(metrics: {
    avgProgress: number;
    avgScore: number;
    passRate: number;
    completionRate: number;
    totalCourses: number;
    totalStudents: number;
  }): readonly InsightCard[] {
    const studentPerCourse =
      metrics.totalCourses > 0 ? Math.round(metrics.totalStudents / metrics.totalCourses) : 0;

    return [
      {
        id: 'compare-progress-completion',
        kind: 'compare',
        severity: metrics.avgProgress >= metrics.completionRate ? 'info' : 'watch',
        title: '推进率 vs 结课率',
        summary: `平均进度 ${metrics.avgProgress}% 对比结课率 ${metrics.completionRate}%，当前更偏向进行中结构。`,
        metric: `${metrics.avgProgress}% / ${metrics.completionRate}%`,
        icon: 'compare_arrows',
        route: '/analytics',
      },
      {
        id: 'compare-score-pass',
        kind: 'compare',
        severity: metrics.passRate >= 80 ? 'info' : 'watch',
        title: '均分 vs 及格率',
        summary: `均分 ${metrics.avgScore}，及格率 ${metrics.passRate}% ，可快速判断成绩分布是否头重脚轻。`,
        metric: `${metrics.avgScore} / ${metrics.passRate}%`,
        icon: 'balance',
        route: '/reports',
      },
      {
        id: 'compare-density',
        kind: 'compare',
        severity: studentPerCourse >= 18 ? 'watch' : 'info',
        title: '课程承载密度',
        summary: `平均每门课约 ${studentPerCourse} 名学生，用于观察教师负载和课程拥挤度。`,
        metric: `${studentPerCourse} 人/课`,
        icon: 'hub',
        route: '/analytics',
      },
    ];
  }

  private buildRecommendations(metrics: {
    highRiskCourses: readonly RiskTarget[];
    highRiskStudents: readonly RiskTarget[];
    plannedCourses: number;
    passRate: number;
    completionRate: number;
  }): readonly InsightAction[] {
    const actions: InsightAction[] = [];

    if (metrics.highRiskCourses.length > 0) {
      actions.push({
        id: 'action-risk-courses',
        label: '优先检查高风险课程',
        description: '进入课程页，优先处理大班低进度和久未更新课程。',
        icon: 'priority_high',
        route: '/courses',
        tone: 'primary',
      });
    }

    if (metrics.highRiskStudents.length > 0) {
      actions.push({
        id: 'action-risk-students',
        label: '关注低分学生',
        description: '回到学生管理工作台，定位不及格和临界分群体。',
        icon: 'person_search',
        route: '/students',
        tone: 'secondary',
      });
    }

    if (metrics.plannedCourses > 0) {
      actions.push({
        id: 'action-planned-courses',
        label: '处理待开课程',
        description: '快速筛出未开始课程，补齐启动动作与节奏安排。',
        icon: 'rocket_launch',
        route: '/courses?status=planned',
        tone: 'secondary',
      });
    }

    if (metrics.passRate < 85 || metrics.completionRate < 55) {
      actions.push({
        id: 'action-open-analytics',
        label: '查看智能洞察',
        description: '进入分析页签，查看对比结论和 AI 预留摘要。',
        icon: 'auto_awesome',
        route: '/analytics',
        tone: 'primary',
      });
    }

    actions.push({
      id: 'action-open-reports',
      label: '导出分析视图',
      description: '进入报表页继续查看课程、成绩和学生结构。',
      icon: 'insights',
      route: '/reports',
      tone: 'secondary',
    });

    return actions.slice(0, 5);
  }

  private daysSince(isoDate: string): number {
    const diff = Date.now() - new Date(isoDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  private severityWeight(severity: InsightSeverity): number {
    if (severity === 'critical') {
      return 4;
    }
    if (severity === 'risk') {
      return 3;
    }
    if (severity === 'watch') {
      return 2;
    }
    return 1;
  }
}
