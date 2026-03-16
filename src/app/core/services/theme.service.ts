import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'aurora.course-manager.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>('light');

  constructor() {
    this.initializeTheme();
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private initializeTheme(): void {
    const persistedTheme = localStorage.getItem(STORAGE_KEY);
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initialTheme: ThemeMode =
      persistedTheme === 'light' || persistedTheme === 'dark'
        ? persistedTheme
        : prefersDark
          ? 'dark'
          : 'light';

    this.theme.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    document.body.classList.remove('app-theme-dark', 'app-theme-light');
    document.body.classList.add(theme === 'dark' ? 'app-theme-dark' : 'app-theme-light');
    document.documentElement.setAttribute('data-theme', theme);
  }
}
