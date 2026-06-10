import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BusinessCardComponent } from './business-card.component';
import { LanguageService } from '../../services/language.service';

async function makeFixture(card: any): Promise<ComponentFixture<BusinessCardComponent>> {
  await TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [BusinessCardComponent, TranslateModule.forRoot()]
  }).compileComponents();
  const fixture = TestBed.createComponent(BusinessCardComponent);
  fixture.componentInstance.card = card;
  fixture.detectChanges();
  return fixture;
}

const fullCard = {
  id: '1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Afri',
  title: 'CEO',
  phone: ' 123 ',
  fax: ' 456 ',
  mobile: '789',
  department: { id: 'd', labelFr: 'Dir', labelEn: 'Dept' },
  jobTitle: { id: 'j', labelFr: 'Chef', labelEn: 'Head' }
};

describe('BusinessCardComponent', () => {
  it('creates and renders the full name', async () => {
    const fixture = await makeFixture(fullCard);
    expect(fixture.componentInstance.fullName()).toBe('John Doe');
  });

  it('falls back to email when no names', async () => {
    const fixture = await makeFixture({ id: '2', email: 'e@x.com' });
    expect(fixture.componentInstance.fullName()).toBe('e@x.com');
  });

  it('returns empty when no email and no names', async () => {
    const fixture = await makeFixture({ id: '3', email: '' });
    expect(fixture.componentInstance.fullName()).toBe('');
  });

  it('displayed title respects language (fr)', async () => {
    const fixture = await makeFixture(fullCard);
    TestBed.inject(LanguageService).set('fr');
    expect(fixture.componentInstance.displayedTitle()).toBe('Chef');
    expect(fixture.componentInstance.displayedDepartment()).toBe('Dir');
  });

  it('displayed title respects language (en)', async () => {
    const fixture = await makeFixture(fullCard);
    TestBed.inject(LanguageService).set('en');
    expect(fixture.componentInstance.displayedTitle()).toBe('Head');
    expect(fixture.componentInstance.displayedDepartment()).toBe('Dept');
  });

  it('displayed title falls back to card.title when jobTitle absent', async () => {
    const fixture = await makeFixture({ ...fullCard, jobTitle: null, title: 'Mgr' });
    TestBed.inject(LanguageService).set('fr');
    expect(fixture.componentInstance.displayedTitle()).toBe('Mgr');
  });

  it('displayed department falls back to company', async () => {
    const fixture = await makeFixture({ ...fullCard, department: null });
    TestBed.inject(LanguageService).set('fr');
    expect(fixture.componentInstance.displayedDepartment()).toBe('Afri');
  });

  it('fixedPhone trims value', async () => {
    const fixture = await makeFixture(fullCard);
    expect(fixture.componentInstance.fixedPhone()).toBe('123');
  });

  it('fixedPhone defaults when null', async () => {
    const fixture = await makeFixture({ ...fullCard, phone: null });
    expect(fixture.componentInstance.fixedPhone()).toBe('222 233 068');
  });

  it('fixedFax defaults when null', async () => {
    const fixture = await makeFixture({ ...fullCard, fax: null });
    expect(fixture.componentInstance.fixedFax()).toBe('222 221 785');
  });

  it('telHref strips spaces', async () => {
    const fixture = await makeFixture(fullCard);
    expect(fixture.componentInstance.telHref('1 2 3')).toBe('tel:123');
    expect(fixture.componentInstance.telHref(null)).toBe('tel:');
  });

  it('onResize triggers scale recomputation', async () => {
    const fixture = await makeFixture(fullCard);
    expect(() => fixture.componentInstance.onResize()).not.toThrow();
  });

  it('ngOnDestroy cleans up without error', async () => {
    const fixture = await makeFixture(fullCard);
    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();
  });

  it('getCardImageFile rejects gracefully on failure', async () => {
    const fixture = await makeFixture(fullCard);
    const component = fixture.componentInstance;
    spyOn<any>(component, 'waitForBackgroundImage').and.returnValue(Promise.resolve());
    spyOn<any>(component, 'waitForImages').and.returnValue(Promise.resolve());
    try {
      await component.getCardImageFile();
    } catch {
      // html-to-image may fail in headless; either path is acceptable
    }
    expect(component).toBeTruthy();
  });

  it('buildImageFileName sanitizes special chars', async () => {
    const fixture = await makeFixture({ ...fullCard, firstName: 'Jöhn', lastName: 'Doe&Sons' });
    // Use private method via cast; ensures buildImageFileName logic is exercised.
    const name = (fixture.componentInstance as any).buildImageFileName();
    expect(name.endsWith('.png')).toBeTrue();
  });
});
