export type InsightSeverity = 'info' | 'watch' | 'risk' | 'critical';
export type InsightKind = 'risk' | 'trend' | 'compare' | 'recommendation';

export interface InsightCard {
  readonly id: string;
  readonly kind: InsightKind;
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly summary: string;
  readonly metric?: string;
  readonly detail?: string;
  readonly icon: string;
  readonly route?: string;
  readonly tags?: readonly string[];
}

export interface InsightAction {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly route: string;
  readonly tone: 'primary' | 'secondary' | 'danger';
}

export interface RiskTarget {
  readonly id: number;
  readonly title: string;
  readonly summary: string;
  readonly severity: InsightSeverity;
  readonly route: string;
  readonly icon: string;
}

export interface InsightSnapshot {
  readonly generatedAt: string;
  readonly totalCourses: number;
  readonly totalStudents: number;
  readonly avgProgress: number;
  readonly avgScore: number;
  readonly passRate: number;
  readonly completionRate: number;
  readonly activeCourses: number;
  readonly plannedCourses: number;
  readonly completedCourses: number;
  readonly highRiskCourses: readonly RiskTarget[];
  readonly highRiskStudents: readonly RiskTarget[];
  readonly risks: readonly InsightCard[];
  readonly trends: readonly InsightCard[];
  readonly comparisons: readonly InsightCard[];
  readonly recommendations: readonly InsightAction[];
}

export type AiAdapterStatus = 'idle' | 'configured' | 'offline' | 'error';

export interface AiInsightProvider {
  summarize(snapshot: InsightSnapshot): readonly InsightCard[];
  suggestActions(snapshot: InsightSnapshot): readonly InsightAction[];
  compareSnapshots(current: InsightSnapshot, baseline: InsightSnapshot): readonly InsightCard[];
}

export interface AiProviderStubConfig {
  readonly endpoint: string;
  readonly model: string;
  readonly apiKey: string;
}
