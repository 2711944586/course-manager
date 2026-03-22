import { Injectable, computed, signal } from '@angular/core';
import {
  AiAdapterStatus,
  AiInsightProvider,
  AiProviderStubConfig,
  InsightAction,
  InsightCard,
  InsightSnapshot,
} from '../models/insight.model';
import { InsightEngineService } from './insight-engine.service';
import { safeStorageGetItem, safeStorageRemoveItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.ai-provider-stub';

class LocalMockInsightProvider implements AiInsightProvider {
  summarize(snapshot: InsightSnapshot): readonly InsightCard[] {
    return [
      ...snapshot.risks.slice(0, 2),
      ...snapshot.trends.slice(0, 2),
    ].map(card => ({
      ...card,
      id: `ai-summary-${card.id}`,
      tags: [...(card.tags ?? []), 'Local Mock'],
    }));
  }

  suggestActions(snapshot: InsightSnapshot): readonly InsightAction[] {
    return snapshot.recommendations.map(action => ({
      ...action,
      id: `ai-action-${action.id}`,
    }));
  }

  compareSnapshots(current: InsightSnapshot, baseline: InsightSnapshot): readonly InsightCard[] {
    return [
      {
        id: 'ai-compare-progress',
        kind: 'compare',
        severity: current.avgProgress >= baseline.avgProgress ? 'info' : 'watch',
        title: '推进基准对比',
        summary: `当前平均进度 ${current.avgProgress}% ，目标基线 ${baseline.avgProgress}%。`,
        metric: `${current.avgProgress}% / ${baseline.avgProgress}%`,
        icon: 'compare',
        route: '/analytics',
        tags: ['Baseline'],
      },
      {
        id: 'ai-compare-pass',
        kind: 'compare',
        severity: current.passRate >= baseline.passRate ? 'info' : 'risk',
        title: '成绩基准对比',
        summary: `当前及格率 ${current.passRate}% ，目标基线 ${baseline.passRate}%。`,
        metric: `${current.passRate}% / ${baseline.passRate}%`,
        icon: 'rule',
        route: '/analytics',
        tags: ['Baseline'],
      },
      {
        id: 'ai-compare-score',
        kind: 'compare',
        severity: current.avgScore >= baseline.avgScore ? 'info' : 'watch',
        title: '均分基准对比',
        summary: `当前均分 ${current.avgScore}，目标基线 ${baseline.avgScore}。`,
        metric: `${current.avgScore} / ${baseline.avgScore}`,
        icon: 'show_chart',
        route: '/analytics',
        tags: ['Baseline'],
      },
    ];
  }
}

@Injectable({ providedIn: 'root' })
export class AiInsightService {
  private readonly configState = signal<AiProviderStubConfig>(this.loadConfig());
  private readonly provider: AiInsightProvider = new LocalMockInsightProvider();

  readonly config = computed(() => this.configState());
  readonly status = computed<AiAdapterStatus>(() => {
    const config = this.configState();
    if (!config.endpoint && !config.model && !config.apiKey) {
      return 'idle';
    }

    if (config.endpoint && config.model && config.apiKey) {
      return 'configured';
    }

    return 'offline';
  });

  readonly statusLabel = computed(() => {
    const status = this.status();
    if (status === 'configured') {
      return '已配置占位 Provider';
    }
    if (status === 'offline') {
      return '配置未完整';
    }
    if (status === 'error') {
      return '连接异常';
    }
    return '未连接';
  });

  readonly summaryCards = computed(() => this.provider.summarize(this.insightEngine.snapshot()));
  readonly suggestedActions = computed(() => this.provider.suggestActions(this.insightEngine.snapshot()));
  readonly baselineComparisons = computed(() =>
    this.provider.compareSnapshots(
      this.insightEngine.snapshot(),
      this.insightEngine.createTargetBaseline(),
    ),
  );

  constructor(private readonly insightEngine: InsightEngineService) {}

  saveStubConfig(config: AiProviderStubConfig): void {
    const normalizedConfig: AiProviderStubConfig = {
      endpoint: config.endpoint.trim(),
      model: config.model.trim(),
      apiKey: config.apiKey.trim(),
    };

    this.configState.set(normalizedConfig);
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(normalizedConfig));
  }

  resetStubConfig(): void {
    const emptyConfig: AiProviderStubConfig = { endpoint: '', model: '', apiKey: '' };
    this.configState.set(emptyConfig);
    safeStorageRemoveItem(STORAGE_KEY);
  }

  private loadConfig(): AiProviderStubConfig {
    try {
      const raw = safeStorageGetItem(STORAGE_KEY);
      if (!raw) {
        return { endpoint: '', model: '', apiKey: '' };
      }

      const parsed = JSON.parse(raw) as Partial<AiProviderStubConfig>;
      return {
        endpoint: parsed.endpoint ?? '',
        model: parsed.model ?? '',
        apiKey: parsed.apiKey ?? '',
      };
    } catch {
      return { endpoint: '', model: '', apiKey: '' };
    }
  }
}
