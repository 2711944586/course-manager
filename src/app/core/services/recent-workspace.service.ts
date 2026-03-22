import { Injectable, computed, signal, untracked } from '@angular/core';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

export interface RecentWorkspaceItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly subtitle?: string;
  readonly visitedAt: string;
}

const STORAGE_KEY = 'aurora.course-manager.recent-workspace';
const MAX_ITEMS = 8;

@Injectable({ providedIn: 'root' })
export class RecentWorkspaceService {
  private readonly itemsState = signal<readonly RecentWorkspaceItem[]>(this.loadItems());

  readonly items = computed(() => this.itemsState());

  track(item: Omit<RecentWorkspaceItem, 'visitedAt'>): void {
    const currentItems = untracked(() => this.itemsState());
    const latestItem = currentItems[0];

    if (
      latestItem &&
      latestItem.route === item.route &&
      latestItem.label === item.label &&
      latestItem.icon === item.icon &&
      latestItem.subtitle === item.subtitle
    ) {
      return;
    }

    const nextItem: RecentWorkspaceItem = {
      ...item,
      visitedAt: new Date().toISOString(),
    };

    const deduped = currentItems.filter(existing => existing.route !== item.route);
    const nextItems = [nextItem, ...deduped].slice(0, MAX_ITEMS);
    this.writeItems(nextItems);
  }

  clear(): void {
    this.writeItems([]);
  }

  private writeItems(items: readonly RecentWorkspaceItem[]): void {
    this.itemsState.set(items);
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(items));
  }

  private loadItems(): readonly RecentWorkspaceItem[] {
    try {
      const raw = safeStorageGetItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (candidate): candidate is RecentWorkspaceItem =>
          typeof candidate === 'object' &&
          candidate !== null &&
          typeof (candidate as RecentWorkspaceItem).label === 'string' &&
          typeof (candidate as RecentWorkspaceItem).route === 'string' &&
          typeof (candidate as RecentWorkspaceItem).icon === 'string' &&
          typeof (candidate as RecentWorkspaceItem).visitedAt === 'string',
      );
    } catch {
      return [];
    }
  }
}
