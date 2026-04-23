import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  function create(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  it('defaults to light when no stored preference and no prefers-color-scheme match', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const svc = create();
    expect(svc.theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('reads stored preference from localStorage', () => {
    localStorage.setItem('app.theme', 'dark');
    const svc = create();
    expect(svc.theme()).toBe('dark');
    expect(svc.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('falls back to system preference when no value is stored', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const svc = create();
    expect(svc.theme()).toBe('dark');
  });

  it('toggle switches between light and dark and persists', () => {
    const svc = create();
    const initial = svc.theme();
    svc.toggle();
    expect(svc.theme()).not.toBe(initial);
    expect(localStorage.getItem('app.theme')).toBe(svc.theme());
    svc.toggle();
    expect(svc.theme()).toBe(initial);
  });

  it('set(dark) adds the dark class on <html>, set(light) removes it', () => {
    const svc = create();
    svc.set('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    svc.set('light');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('app.theme', 'purple');
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const svc = create();
    expect(svc.theme()).toBe('light');
  });
});
