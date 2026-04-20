import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

class TranslateStub {
  currentLang: string | undefined;
  lastUsed?: string;
  use(lang: string) {
    this.lastUsed = lang;
    return { subscribe: () => {} } as any;
  }
}

describe('LanguageService', () => {
  function setup(currentLang?: string) {
    const stub = new TranslateStub();
    stub.currentLang = currentLang;
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: stub }
      ]
    });
    return { stub, service: TestBed.inject(LanguageService) };
  }

  it('defaults to fr when translate has no default', () => {
    const { service } = setup(undefined);
    expect(service.lang()).toBe('fr');
  });

  it('uses en when default is en', () => {
    const { service, stub } = setup('en');
    expect(service.lang()).toBe('en');
    expect(stub.lastUsed).toBe('en');
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
