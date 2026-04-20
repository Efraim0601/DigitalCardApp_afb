import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../shared/services/admin.service';
import { DepartmentsAdminPageComponent } from './departments-admin.page';

describe('DepartmentsAdminPageComponent', () => {
  let admin: any;
  let fixture: ComponentFixture<DepartmentsAdminPageComponent>;
  let component: DepartmentsAdminPageComponent;

  function init() {
    admin = {
      listDepartments: jasmine.createSpy().and.returnValue(of({ items: [{ id: 'd1', labelFr: 'Fr', labelEn: 'En' }], total: 25, limit: 20, offset: 0 })),
      createDepartment: jasmine.createSpy().and.returnValue(of({ id: 'd2', labelFr: 'F', labelEn: 'E' })),
      deleteDepartment: jasmine.createSpy().and.returnValue(of(null))
    };
    TestBed.configureTestingModule({
      imports: [DepartmentsAdminPageComponent],
      providers: [{ provide: AdminService, useValue: admin }]
    });
    fixture = TestBed.createComponent(DepartmentsAdminPageComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => init());

  it('loads data on init and computes maxPage', () => {
    expect(component.items().length).toBe(1);
    expect(component.maxPage()).toBe(2);
  });

  it('onSearch resets and reloads', () => {
    component.onSearch('abc');
    expect(component.q()).toBe('abc');
    expect(component.page()).toBe(1);
  });

  it('prev/nextPage respect bounds', () => {
    component.prevPage();
    expect(component.page()).toBe(1);
    component.maxPage.set(3);
    component.nextPage();
    expect(component.page()).toBe(2);
    component.prevPage();
    expect(component.page()).toBe(1);
    component.page.set(3);
    component.nextPage();
    expect(component.page()).toBe(3);
  });

  it('openForm/cancelForm', () => {
    component.openForm();
    expect(component.showForm()).toBeTrue();
    component.cancelForm();
    expect(component.showForm()).toBeFalse();
  });

  it('save invalid does nothing', () => {
    component.openForm();
    component.save();
    expect(admin.createDepartment).not.toHaveBeenCalled();
  });

  it('save valid submits', () => {
    component.openForm();
    component.form.controls.labelFr.setValue('a');
    component.form.controls.labelEn.setValue('b');
    component.save();
    expect(admin.createDepartment).toHaveBeenCalledWith({ labelFr: 'a', labelEn: 'b' });
    expect(component.showForm()).toBeFalse();
  });

  it('save error sets message', fakeAsync(() => {
    admin.createDepartment.and.returnValue(throwError(() => new Error('x')));
    component.openForm();
    component.form.controls.labelFr.setValue('a');
    component.form.controls.labelEn.setValue('b');
    component.save();
    tick();
    expect(component.error()).toBeTruthy();
  }));

  it('deleteOne cancels when not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteOne('d1');
    expect(admin.deleteDepartment).not.toHaveBeenCalled();
  });

  it('deleteOne calls API', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteOne('d1');
    expect(admin.deleteDepartment).toHaveBeenCalledWith('d1');
  });

  it('deleteOne error path', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    admin.deleteDepartment.and.returnValue(throwError(() => new Error('x')));
    component.deleteOne('d1');
    tick();
    expect(component.error()).toBeTruthy();
  }));

  it('load error path', fakeAsync(() => {
    admin.listDepartments.and.returnValue(throwError(() => new Error('x')));
    component.load();
    tick();
    expect(component.error()).toBeTruthy();
  }));
});
