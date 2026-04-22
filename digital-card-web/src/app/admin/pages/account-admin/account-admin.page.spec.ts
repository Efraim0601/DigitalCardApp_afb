import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { AccountAdminPageComponent } from './account-admin.page';

describe('AccountAdminPageComponent', () => {
  let fixture: ComponentFixture<AccountAdminPageComponent>;
  let component: AccountAdminPageComponent;
  let auth: { updateAdminCredentials: jasmine.Spy };

  beforeEach(async () => {
    auth = { updateAdminCredentials: jasmine.createSpy().and.returnValue(of(null)) };
    await TestBed.configureTestingModule({
      imports: [AccountAdminPageComponent, TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: auth }]
    }).compileComponents();
    fixture = TestBed.createComponent(AccountAdminPageComponent);
    component = fixture.componentInstance;
  });

  it('submit with invalid form sets error', () => {
    component.submit();
    expect(component.error()).toBe('admin.account.errors.currentPasswordRequired');
  });

  it('submit with no changes errors', () => {
    component.form.controls.currentPassword.setValue('cur');
    component.submit();
    expect(component.error()).toBe('admin.account.errors.noChanges');
  });

  it('submit success', fakeAsync(() => {
    component.form.controls.currentPassword.setValue('cur');
    component.form.controls.newEmail.setValue('n@e.com');
    component.submit();
    tick();
    expect(auth.updateAdminCredentials).toHaveBeenCalled();
    expect(component.success()).toBeTrue();
  }));

  it('submit error sets error message', fakeAsync(() => {
    auth.updateAdminCredentials.and.returnValue(throwError(() => new Error('fail')));
    component.form.controls.currentPassword.setValue('cur');
    component.form.controls.newPassword.setValue('new');
    component.submit();
    tick();
    expect(component.error()).toBeTruthy();
    expect(component.isSaving()).toBeFalse();
  }));

  it('submits only password when email empty', fakeAsync(() => {
    component.form.controls.currentPassword.setValue('cur');
    component.form.controls.newPassword.setValue('p');
    component.submit();
    tick();
    expect(auth.updateAdminCredentials).toHaveBeenCalledWith(
      jasmine.objectContaining({ newEmail: null, newPassword: 'p' })
    );
  }));
});
