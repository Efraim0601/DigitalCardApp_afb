import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<'fr' | 'en'>('fr');

  constructor(private readonly translate: TranslateService) {
    const initial = (translate.defaultLang as 'fr' | 'en' | undefined) ?? 'fr';
    this.set(initial === 'en' ? 'en' : 'fr');
  }

  set(lang: 'fr' | 'en') {
    this.lang.set(lang);
    this.translate.use(lang);
  }

  toggle() {
    this.set(this.lang() === 'fr' ? 'en' : 'fr');
  }
}

