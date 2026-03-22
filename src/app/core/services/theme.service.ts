import { Injectable, signal } from '@angular/core';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'aurora.course-manager.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>('dark');

  constructor() {
    this.initializeTheme();
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    safeStorageSetItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private initializeTheme(): void {
    const persistedTheme = safeStorageGetItem(STORAGE_KEY);
    const initialTheme: ThemeMode =
      persistedTheme === 'light' || persistedTheme === 'dark'
        ? persistedTheme
        : 'dark';

    this.theme.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    document.body.classList.remove('app-theme-dark', 'app-theme-light');
    document.body.classList.add(theme === 'dark' ? 'app-theme-dark' : 'app-theme-light');
    document.documentElement.setAttribute('data-theme', theme);
  }
}
