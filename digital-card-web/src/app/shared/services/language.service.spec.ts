import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

const STORAGE_KEY = 'app.lang';

class TranslateStub {
  lastUsed?: string;
  use(lang: string) {
    this.lastUsed = lang;
    return { subscribe: () => {} } as unknown as ReturnType<TranslateService['use']>;
  }
}

describe('LanguageService', () => {
  function setup() {
    const stub = new TranslateStub();
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: stub }
      ]
    });
    return { stub, service: TestBed.inject(LanguageService) };
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('defaults to fr when nothing is stored', () => {
    const { service, stub } = setup();
    expect(service.lang()).toBe('fr');
    expect(stub.lastUsed).toBe('fr');
  });

  it('restores en when stored in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    const { service, stub } = setup();
    expect(service.lang()).toBe('en');
    expect(stub.lastUsed).toBe('en');
  });

  it('ignores invalid stored value and defaults to fr', () => {
    localStorage.setItem(STORAGE_KEY, 'xx');
    const { service } = setup();
    expect(service.lang()).toBe('fr');
  });

  it('toggle flips language', () => {
    const { service } = setup();
    service.toggle();
    expect(service.lang()).toBe('en');
    service.toggle();
    expect(service.lang()).toBe('fr');
  });

  it('set updates language, calls translate.use and persists', () => {
    const { service, stub } = setup();
    service.set('en');
    expect(service.lang()).toBe('en');
    expect(stub.lastUsed).toBe('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});
