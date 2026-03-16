import { Injectable, signal, computed } from '@angular/core';

export interface ActivityEntry {
  readonly id: number;
  readonly action: 'create' | 'update' | 'delete' | 'import' | 'export';
  readonly entity: 'course' | 'student' | 'teacher' | 'enrollment' | 'system';
  readonly entityName: string;
  readonly detail: string;
  readonly timestamp: string;
}

const STORAGE_KEY = 'aurora.course-manager.activity-log';
const MAX_ENTRIES = 200;

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private readonly entriesSignal = signal<readonly ActivityEntry[]>(this.loadFromStorage());

  readonly entries = computed(() => this.entriesSignal());

  readonly recentEntries = computed(() => this.entriesSignal().slice(0, 50));

  readonly stats = computed(() => {
    const all = this.entriesSignal();
    return {
      total: all.length,
      creates: all.filter(e => e.action === 'create').length,
      updates: all.filter(e => e.action === 'update').length,
      deletes: all.filter(e => e.action === 'delete').length,
    };
  });

  log(action: ActivityEntry['action'], entity: ActivityEntry['entity'], entityName: string, detail: string): void {
    const entry: ActivityEntry = {
      id: Date.now(),
      action,
      entity,
      entityName,
      detail,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...this.entriesSignal()].slice(0, MAX_ENTRIES);
    this.entriesSignal.set(updated);
    this.saveToStorage(updated);
  }

  clearAll(): void {
    this.entriesSignal.set([]);
    this.saveToStorage([]);
  }

  filterByEntity(entity: ActivityEntry['entity']): readonly ActivityEntry[] {
    return this.entriesSignal().filter(e => e.entity === entity);
  }

  private loadFromStorage(): readonly ActivityEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.generateSeedData();
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return this.generateSeedData();
      return parsed.filter(
        (item): item is ActivityEntry =>
          typeof item === 'object' && item !== null &&
          typeof item.id === 'number' && typeof item.action === 'string' &&
          typeof item.entity === 'string' && typeof item.timestamp === 'string'
      );
    } catch {
      return this.generateSeedData();
    }
  }

  private saveToStorage(entries: readonly ActivityEntry[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  private generateSeedData(): ActivityEntry[] {
    const now = Date.now();
    const entries: ActivityEntry[] = [
      { id: now - 1, action: 'create', entity: 'system', entityName: '系统', detail: '系统初始化，生成种子数据', timestamp: new Date(now - 86400000).toISOString() },
      { id: now - 2, action: 'create', entity: 'course', entityName: '高等数学', detail: '创建课程：高等数学', timestamp: new Date(now - 82800000).toISOString() },
      { id: now - 3, action: 'create', entity: 'student', entityName: '张明远', detail: '新增学生：张明远 (S20260001)', timestamp: new Date(now - 79200000).toISOString() },
      { id: now - 4, action: 'update', entity: 'course', entityName: '线性代数', detail: '更新课程进度：45% → 60%', timestamp: new Date(now - 72000000).toISOString() },
      { id: now - 5, action: 'create', entity: 'enrollment', entityName: '选课记录', detail: '张明远 选修 高等数学', timestamp: new Date(now - 64800000).toISOString() },
      { id: now - 6, action: 'update', entity: 'teacher', entityName: '李教授', detail: '更新教师信息：职称变更', timestamp: new Date(now - 57600000).toISOString() },
      { id: now - 7, action: 'export', entity: 'system', entityName: '系统', detail: '导出数据备份 (JSON)', timestamp: new Date(now - 43200000).toISOString() },
      { id: now - 8, action: 'create', entity: 'course', entityName: '数据结构', detail: '创建课程：数据结构', timestamp: new Date(now - 36000000).toISOString() },
      { id: now - 9, action: 'update', entity: 'student', entityName: '王晓芳', detail: '更新学生成绩：78 → 85', timestamp: new Date(now - 28800000).toISOString() },
      { id: now - 10, action: 'delete', entity: 'enrollment', entityName: '选课记录', detail: '删除选课记录：王晓芳 退选 英语写作', timestamp: new Date(now - 14400000).toISOString() },
    ];
    this.saveToStorage(entries);
    return entries;
  }
}
