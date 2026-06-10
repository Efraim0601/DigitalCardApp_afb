import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'app.lang';
type Lang = 'fr' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>('fr');

  constructor(private readonly translate: TranslateService) {
    const stored = this.readStoredLang();
    this.set(stored ?? 'fr');
  }

  set(lang: Lang) {
    this.lang.set(lang);
    this.translate.use(lang);
    this.writeStoredLang(lang);
  }

  toggle() {
    this.set(this.lang() === 'fr' ? 'en' : 'fr');
  }

  private readStoredLang(): Lang | null {
    try {
      const v = globalThis.localStorage?.getItem(STORAGE_KEY);
      return v === 'en' || v === 'fr' ? v : null;
    } catch {
      return null;
    }
  }

  private writeStoredLang(lang: Lang): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage may be unavailable (SSR, privacy mode) — ignore.
    }
  }
}
