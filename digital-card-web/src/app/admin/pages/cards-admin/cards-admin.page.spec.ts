import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../shared/services/admin.service';
import { CardsAdminPageComponent } from './cards-admin.page';

describe('CardsAdminPageComponent', () => {
  let admin: any;
  let fixture: ComponentFixture<CardsAdminPageComponent>;
  let component: CardsAdminPageComponent;

  function init(overrides: Partial<typeof admin> = {}) {
    admin = {
      listDepartments: jasmine.createSpy().and.returnValue(of({ items: [{ id: 'd1', labelFr: 'F', labelEn: 'E' }], total: 1, limit: 200, offset: 0 })),
      listJobTitles: jasmine.createSpy().and.returnValue(of({ items: [{ id: 'j1', labelFr: 'Fr', labelEn: 'En' }], total: 1, limit: 200, offset: 0 })),
      listCards: jasmine.createSpy().and.returnValue(of({ items: [{ id: 'c1', email: 'a@b.com' }], total: 1, limit: 20, offset: 0 })),
      createOrUpsertCard: jasmine.createSpy().and.returnValue(of({ id: 'c1', email: 'a@b.com' })),
      bulkDeleteCards: jasmine.createSpy().and.returnValue(of({ success: true, deleted: 1 })),
      ...overrides
    };
    TestBed.configureTestingModule({
      imports: [CardsAdminPageComponent],
      providers: [{ provide: AdminService, useValue: admin }]
    });
    fixture = TestBed.createComponent(CardsAdminPageComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => init());

  it('loads data on init', () => {
    expect(admin.listCards).toHaveBeenCalled();
    expect(component.cards().length).toBe(1);
    expect(component.total()).toBe(1);
  });

  it('search resets page and reloads', () => {
    component.page.set(2);
    component.onSearch('query');
    expect(component.q()).toBe('query');
    expect(component.page()).toBe(1);
  });

  it('prevPage/nextPage respect bounds', () => {
    component.page.set(1);
    component.prevPage();
    expect(component.page()).toBe(1);
    component.total.set(100);
    component.nextPage();
    expect(component.page()).toBe(2);
    component.prevPage();
    expect(component.page()).toBe(1);
    component.page.set(5);
    component.nextPage();
    expect(component.page()).toBe(5); // can't go past max (100/20=5)
  });

  it('toggleSelectAll and toggleOne', () => {
    component.cards.set([{ id: 'a' } as any, { id: 'b' } as any]);
    component.toggleSelectAll(true);
    expect(component.selectedCount()).toBe(2);
    component.toggleOne('a', false);
    expect(component.selectedCount()).toBe(1);
  });

  it('startCreate resets form', () => {
    component.startCreate();
    expect(component.isEditing()).toBeFalse();
    expect(component.formTitle()).toContain('Créer');
  });

  it('startEdit populates form', () => {
    component.startEdit({ id: 'c1', email: 'a@b.com', firstName: 'A', lastName: 'B',
      department: { id: 'd1', labelFr: 'F', labelEn: 'E' },
      jobTitle: { id: 'j1', labelFr: 'Fr', labelEn: 'En' }, mobile: '1' } as any);
    expect(component.isEditing()).toBeTrue();
    expect(component.form.controls.email.value).toBe('a@b.com');
  });

  it('cancelEdit resets form', () => {
    component.form.controls.email.setValue('x@x.com');
    component.cancelEdit();
    expect(component.form.controls.email.value).toBe('');
  });

  it('save invalid does nothing', () => {
    component.save();
    expect(admin.createOrUpsertCard).not.toHaveBeenCalled();
  });

  it('save submits payload and reloads', () => {
    component.form.controls.email.setValue('a@b.com');
    component.form.controls.jobTitleId.setValue('j1');
    component.save();
    expect(admin.createOrUpsertCard).toHaveBeenCalled();
  });

  it('save error sets error', fakeAsync(() => {
    admin.createOrUpsertCard.and.returnValue(throwError(() => new Error('x')));
    component.form.controls.email.setValue('a@b.com');
    component.save();
    tick();
    expect(component.error()).toBeTruthy();
  }));

  it('labelForJobTitle returns empty when no id', () => {
    expect(component.labelForJobTitle('')).toBe('');
  });

  it('bulkDelete no-op when none selected', () => {
    component.bulkDelete();
    expect(admin.bulkDeleteCards).not.toHaveBeenCalled();
  });

  it('bulkDelete asks for confirm and calls API', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.cards.set([{ id: 'x' } as any]);
    component.toggleOne('x', true);
    component.bulkDelete();
    expect(admin.bulkDeleteCards).toHaveBeenCalledWith(['x']);
  });

  it('bulkDelete cancel skips API', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.cards.set([{ id: 'x' } as any]);
    component.toggleOne('x', true);
    component.bulkDelete();
    expect(admin.bulkDeleteCards).not.toHaveBeenCalled();
  });

  it('deleteOne cancel skips API', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteOne('x');
    expect(admin.bulkDeleteCards).not.toHaveBeenCalled();
  });

  it('deleteOne confirm calls API', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteOne('x');
    expect(admin.bulkDeleteCards).toHaveBeenCalledWith(['x']);
  });

  it('load error sets message', fakeAsync(() => {
    admin.listCards.and.returnValue(throwError(() => new Error('x')));
    component.load();
    tick();
    expect(component.error()).toBeTruthy();
    expect(component.cards()).toEqual([]);
  }));

  it('loadReferenceData error results in empty lists', fakeAsync(() => {
    admin.listDepartments.and.returnValue(throwError(() => new Error('x')));
    component.loadReferenceData();
    tick();
    expect(component.departments()).toEqual([]);
    expect(component.jobTitles()).toEqual([]);
  }));

  it('deleteOne failure sets error', fakeAsync(() => {
    admin.bulkDeleteCards.and.returnValue(throwError(() => new Error('x')));
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteOne('x');
    tick();
    expect(component.error()).toBeTruthy();
  }));
});
