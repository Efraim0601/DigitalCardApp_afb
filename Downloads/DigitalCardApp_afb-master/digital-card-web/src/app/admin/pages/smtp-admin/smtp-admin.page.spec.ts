import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../shared/services/admin.service';
import { SmtpAdminPageComponent } from './smtp-admin.page';

describe('SmtpAdminPageComponent', () => {
  let admin: any;
  let fixture: ComponentFixture<SmtpAdminPageComponent>;
  let component: SmtpAdminPageComponent;

  function init(smtpReturn: any = of({
    enabled: true, host: 'h', port: 25, username: 'u', hasPassword: true,
    protocol: '', auth: true, starttlsEnabled: true, sslEnabled: false,
    fromEmail: 'f@e.com', fromName: null, updatedAt: null
  })) {
    admin = {
      getSmtpSettings: jasmine.createSpy().and.returnValue(smtpReturn),
      updateSmtpSettings: jasmine.createSpy().and.returnValue(of({})),
      sendSmtpTestEmail: jasmine.createSpy().and.returnValue(of({ success: true }))
    };
    TestBed.configureTestingModule({
      imports: [SmtpAdminPageComponent, TranslateModule.forRoot()],
      providers: [{ provide: AdminService, useValue: admin }]
    });
    fixture = TestBed.createComponent(SmtpAdminPageComponent);
    component = fixture.componentInstance;
  }

  it('load patches form from settings', () => {
    init();
    expect(component.form.controls.host.value).toBe('h');
    expect(component.form.controls.protocol.value).toBe('smtp');
  });

  it('load error sets error', fakeAsync(() => {
    init(throwError(() => new Error('x')));
    tick();
    expect(component.error()).toBeTruthy();
  }));

  it('load null settings is no-op for form', fakeAsync(() => {
    init(of(null));
    tick();
    // no exception
    expect(component).toBeTruthy();
  }));

  it('save invalid form sets error', () => {
    init();
    component.form.controls.port.setValue(-1);
    component.save();
    expect(component.error()).toBeTruthy();
  });

  it('save submits payload incl. password', fakeAsync(() => {
    init();
    component.form.controls.password.setValue('secret');
    component.save();
    tick();
    const arg = admin.updateSmtpSettings.calls.mostRecent().args[0];
    expect(arg.password).toBe('secret');
    expect(component.success()).toBeTrue();
  }));

  it('save without password omits it', fakeAsync(() => {
    init();
    component.save();
    tick();
    const arg = admin.updateSmtpSettings.calls.mostRecent().args[0];
    expect(arg.password).toBeUndefined();
  }));

  it('save error sets message', fakeAsync(() => {
    init();
    admin.updateSmtpSettings.and.returnValue(throwError(() => ({ error: { error: 'bad' } })));
    component.save();
    tick();
    expect(component.error()).toBe('bad');
    expect(component.isSaving()).toBeFalse();
  }));

  it('sendTest requires email', () => {
    init();
    component.form.controls.testToEmail.setValue('');
    component.sendTest();
    expect(component.error()).toBeTruthy();
    expect(admin.sendSmtpTestEmail).not.toHaveBeenCalled();
  });

  it('sendTest success', fakeAsync(() => {
    init();
    component.form.controls.testToEmail.setValue('a@b.com');
    component.sendTest();
    tick();
    expect(admin.sendSmtpTestEmail).toHaveBeenCalledWith('a@b.com');
    expect(component.testSuccess()).toBeTrue();
  }));

  it('sendTest error', fakeAsync(() => {
    init();
    admin.sendSmtpTestEmail.and.returnValue(throwError(() => ({ error: { error: 'bad' } })));
    component.form.controls.testToEmail.setValue('a@b.com');
    component.sendTest();
    tick();
    expect(component.error()).toBe('bad');
  }));
});
