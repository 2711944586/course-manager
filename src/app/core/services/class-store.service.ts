import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { extractHttpErrorMessage } from '../utils/http-error.util';
import { SchoolClass, SchoolClassCreateInput } from '../models/class.model';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';
import { ClassService } from './class.service';

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
  private readonly classService = inject(ClassService);
  private readonly classState = signal<readonly SchoolClass[]>(this.loadClasses());

  readonly classes = computed(() => this.classState());

  constructor() {
    void this.refreshClasses();
  }

  getClassById(classId: string): SchoolClass | undefined {
    return this.classState().find(c => c.id === classId);
  }

  getClassName(classId: string | null): string {
    if (!classId) return '未分班';
    return this.getClassById(classId)?.className ?? classId;
  }

  async refreshClasses(): Promise<readonly SchoolClass[]> {
    try {
      const classes = await firstValueFrom(this.classService.getClasses());
      const normalized = this.normalizeClasses(classes);
      this.writeClasses(normalized);
      return normalized;
    } catch (error) {
      if (this.classState().length > 0) {
        return this.classState();
      }

      throw new Error(extractHttpErrorMessage(error, '加载班级列表失败'));
    }
  }

  async addClass(input: SchoolClassCreateInput): Promise<SchoolClass> {
    const existing = this.getClassById(input.id);
    if (existing) {
      throw new Error(`班级 ${input.id} 已存在`);
    }

    const created = await firstValueFrom(
      this.classService.addClass({
        id: input.id.trim(),
        className: input.className.trim(),
      }),
    );
    this.writeClasses([...this.classState().filter(item => item.id !== created.id), created]);
    return created;
  }

  async removeClass(classId: string): Promise<void> {
    const next = this.classState().filter(c => c.id !== classId);
    if (next.length === this.classState().length) {
      throw new Error('班级不存在');
    }

    await firstValueFrom(this.classService.deleteClass(classId));
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

  private normalizeClasses(classes: readonly SchoolClass[]): readonly SchoolClass[] {
    return classes
      .filter((schoolClass): schoolClass is SchoolClass => Boolean(schoolClass?.id && schoolClass.className))
      .map(schoolClass => ({
        id: schoolClass.id.trim(),
        className: schoolClass.className.trim(),
      }));
  }
}
