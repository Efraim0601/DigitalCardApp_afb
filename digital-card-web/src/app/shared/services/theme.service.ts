import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.theme';
const DARK_CLASS = 'dark';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor() {
    this.set(this.readStoredTheme() ?? this.preferredTheme());
  }

  set(theme: Theme) {
    this.theme.set(theme);
    this.applyTheme(theme);
    this.writeStoredTheme(theme);
  }

  toggle() {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private applyTheme(theme: Theme) {
    const root = globalThis.document?.documentElement;
    if (!root) return;
    if (theme === 'dark') {
      root.classList.add(DARK_CLASS);
    } else {
      root.classList.remove(DARK_CLASS);
    }
  }

  private preferredTheme(): Theme {
    try {
      return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private readStoredTheme(): Theme | null {
    try {
      const v = globalThis.localStorage?.getItem(STORAGE_KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch {
      return null;
    }
  }

  private writeStoredTheme(theme: Theme): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable (SSR, privacy mode) — ignore.
    }
  }
}
