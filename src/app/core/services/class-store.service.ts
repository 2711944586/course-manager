import { Injectable, computed, signal } from '@angular/core';
import { SchoolClass, SchoolClassCreateInput } from '../models/class.model';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.classes';

const SEED_CLASSES: readonly SchoolClass[] = [
  { id: 'CS2021', className: '计算机科学 2021 班' },
  { id: 'SE2021', className: '软件工程 2021 班' },
  { id: 'AI2021', className: '人工智能 2021 班' },
  { id: 'NET2021', className: '网络工程 2021 班' },
  { id: 'DS2021', className: '数据科学 2021 班' },
  { id: 'BUS2021', className: '商务管理 2021 班' },
];

@Injectable({ providedIn: 'root' })
export class ClassStoreService {
  private readonly classState = signal<readonly SchoolClass[]>(this.loadClasses());

  readonly classes = computed(() => this.classState());

  getClassById(classId: string): SchoolClass | undefined {
    return this.classState().find(c => c.id === classId);
  }

  getClassName(classId: string | null): string {
    if (!classId) return '未分班';
    return this.getClassById(classId)?.className ?? classId;
  }

  addClass(input: SchoolClassCreateInput): SchoolClass {
    const existing = this.getClassById(input.id);
    if (existing) {
      throw new Error(`班级 ${input.id} 已存在`);
    }
    const created: SchoolClass = { id: input.id.trim(), className: input.className.trim() };
    this.writeClasses([...this.classState(), created]);
    return created;
  }

  removeClass(classId: string): void {
    const next = this.classState().filter(c => c.id !== classId);
    if (next.length === this.classState().length) {
      throw new Error('班级不存在');
    }
    this.writeClasses(next);
  }

  resetToSeed(): void {
    this.writeClasses(SEED_CLASSES);
  }

  private writeClasses(classes: readonly SchoolClass[]): void {
    this.classState.set(classes);
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(classes));
  }

  private loadClasses(): readonly SchoolClass[] {
    const raw = safeStorageGetItem(STORAGE_KEY);
    if (!raw) {
      const seed = [...SEED_CLASSES];
      safeStorageSetItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch { /* corrupt */ }

    const seed = [...SEED_CLASSES];
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}
