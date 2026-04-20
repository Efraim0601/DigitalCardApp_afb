import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../shared/services/admin.service';
import { JobTitlesAdminPageComponent } from './job-titles-admin.page';

describe('JobTitlesAdminPageComponent', () => {
  let admin: any;
  let fixture: ComponentFixture<JobTitlesAdminPageComponent>;
  let component: JobTitlesAdminPageComponent;

  function init() {
    admin = {
      listJobTitles: jasmine.createSpy().and.returnValue(of({ items: [{ id: 'j1', labelFr: 'F', labelEn: 'E' }], total: 1, limit: 20, offset: 0 })),
      createJobTitle: jasmine.createSpy().and.returnValue(of({ id: 'j2', labelFr: 'A', labelEn: 'B' })),
      deleteJobTitle: jasmine.createSpy().and.returnValue(of(null))
    };
    TestBed.configureTestingModule({
      imports: [JobTitlesAdminPageComponent],
      providers: [{ provide: AdminService, useValue: admin }]
    });
    fixture = TestBed.createComponent(JobTitlesAdminPageComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => init());

  it('loads data', () => expect(component.items().length).toBe(1));

  it('onSearch reloads', () => {
    component.onSearch('abc');
    expect(component.q()).toBe('abc');
  });

  it('prev/nextPage bounds', () => {
    component.prevPage();
    expect(component.page()).toBe(1);
    component.maxPage.set(2);
    component.nextPage();
    expect(component.page()).toBe(2);
    component.nextPage();
    expect(component.page()).toBe(2);
    component.prevPage();
    expect(component.page()).toBe(1);
  });

  it('openForm / cancelForm', () => {
    component.openForm();
    expect(component.showForm()).toBeTrue();
    component.cancelForm();
    expect(component.showForm()).toBeFalse();
  });

  it('save invalid skips', () => {
    component.openForm();
    component.save();
    expect(admin.createJobTitle).not.toHaveBeenCalled();
  });

  it('save valid submits', () => {
    component.openForm();
    component.form.controls.labelFr.setValue('a');
    component.form.controls.labelEn.setValue('b');
    component.save();
    expect(admin.createJobTitle).toHaveBeenCalled();
  });

  it('save error', fakeAsync(() => {
    admin.createJobTitle.and.returnValue(throwError(() => new Error('x')));
    component.openForm();
    component.form.controls.labelFr.setValue('a');
    component.form.controls.labelEn.setValue('b');
    component.save();
    tick();
    expect(component.error()).toBeTruthy();
  }));

  it('deleteOne skip when not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteOne('j1');
    expect(admin.deleteJobTitle).not.toHaveBeenCalled();
  });

  it('deleteOne confirm', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteOne('j1');
    expect(admin.deleteJobTitle).toHaveBeenCalledWith('j1');
  });

  it('deleteOne error', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    admin.deleteJobTitle.and.returnValue(throwError(() => new Error('x')));
    component.deleteOne('j1');
    tick();
    expect(component.error()).toBeTruthy();
  }));

  it('load error', fakeAsync(() => {
    admin.listJobTitles.and.returnValue(throwError(() => new Error('x')));
    component.load();
    tick();
    expect(component.error()).toBeTruthy();
  }));
});
