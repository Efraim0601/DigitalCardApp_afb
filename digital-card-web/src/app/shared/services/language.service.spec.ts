import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

class TranslateStub {
  private current: string | null = null;
  private fallback: string | null = null;
  lastUsed?: string;

  setCurrent(lang: string | null) { this.current = lang; }
  setFallback(lang: string | null) { this.fallback = lang; }

  getCurrentLang() { return this.current; }
  getFallbackLang() { return this.fallback; }

  use(lang: string) {
    this.lastUsed = lang;
    return { subscribe: () => {} } as any;
  }
}

describe('LanguageService', () => {
  function setup(current: string | null, fallback: string | null = null) {
    const stub = new TranslateStub();
    stub.setCurrent(current);
    stub.setFallback(fallback);
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: stub }
      ]
    });
    return { stub, service: TestBed.inject(LanguageService) };
  }

  it('defaults to fr when translate has no current or fallback', () => {
    const { service } = setup(null);
    expect(service.lang()).toBe('fr');
  });

  it('uses en when current is en', () => {
    const { service, stub } = setup('en');
    expect(service.lang()).toBe('en');
    expect(stub.lastUsed).toBe('en');
  });

  it('falls back to fallbackLang when no currentLang', () => {
    const { service } = setup(null, 'en');
    expect(service.lang()).toBe('en');
  });

  it('toggle flips language', () => {
    const { service } = setup('fr');
    service.toggle();
    expect(service.lang()).toBe('en');
    service.toggle();
    expect(service.lang()).toBe('fr');
  });

  it('set updates language and calls translate.use', () => {
    const { service, stub } = setup('fr');
    service.set('en');
    expect(service.lang()).toBe('en');
    expect(stub.lastUsed).toBe('en');
  });
});
