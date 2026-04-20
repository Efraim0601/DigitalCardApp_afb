import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: { loginHint: jasmine.Spy; adminLogin: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = {
      loginHint: jasmine.createSpy('loginHint').and.returnValue(of({ isAdminEmail: false, hasCard: true })),
      adminLogin: jasmine.createSpy('adminLogin').and.returnValue(of(null))
    };
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('onEmailBlur does nothing for empty email', () => {
    component.onEmailBlur();
    expect(auth.loginHint).not.toHaveBeenCalled();
  });

  it('onEmailBlur does nothing for invalid email', () => {
    component.form.controls.email.setValue('bad');
    component.onEmailBlur();
    expect(auth.loginHint).not.toHaveBeenCalled();
  });

  it('onEmailBlur navigates to /card when hasCard and not admin', fakeAsync(() => {
    component.form.controls.email.setValue('u@site.com');
    component.onEmailBlur();
    tick();
    expect(router.navigate).toHaveBeenCalledWith(['/card'], { queryParams: { email: 'u@site.com' } });
  }));

  it('onEmailBlur sets hint without navigating for admin', fakeAsync(() => {
    auth.loginHint.and.returnValue(of({ isAdminEmail: true, hasCard: false }));
    component.form.controls.email.setValue('admin@site.com');
    component.onEmailBlur();
    tick();
    expect(component.isAdmin()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('onEmailBlur sets serverError on hint error', fakeAsync(() => {
    auth.loginHint.and.returnValue(throwError(() => new Error('x')));
    component.form.controls.email.setValue('a@b.com');
    component.onEmailBlur();
    tick();
    expect(component.serverError()).toBe('login.errors.generic');
  }));

  it('submit marks touched when form invalid', () => {
    component.submit();
    expect(component.form.touched).toBeTrue();
  });

  it('submit: admin without password sets error', () => {
    component.hint.set({ isAdminEmail: true, hasCard: false });
    component.form.controls.email.setValue('admin@x.com');
    component.submit();
    expect(component.form.controls.password.errors).toEqual({ required: true });
  });

  it('submit: admin with password calls adminLogin', fakeAsync(() => {
    component.hint.set({ isAdminEmail: true, hasCard: false });
    component.form.controls.email.setValue('admin@x.com');
    component.form.controls.password.setValue('pwd');
    component.submit();
    tick();
    expect(auth.adminLogin).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/cards']);
  }));

  it('submit: admin login failure sets error', fakeAsync(() => {
    auth.adminLogin.and.returnValue(throwError(() => new Error('x')));
    component.hint.set({ isAdminEmail: true, hasCard: false });
    component.form.controls.email.setValue('admin@x.com');
    component.form.controls.password.setValue('pwd');
    component.submit();
    tick();
    expect(component.serverError()).toBe('login.errors.generic');
  }));

  it('submit: non-admin with card navigates to /card', () => {
    component.hint.set({ isAdminEmail: false, hasCard: true });
    component.form.controls.email.setValue('u@x.com');
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/card'], { queryParams: { email: 'u@x.com' } });
  });

  it('submit: non-admin without card sets noCard error', () => {
    component.hint.set({ isAdminEmail: false, hasCard: false });
    component.form.controls.email.setValue('u@x.com');
    component.submit();
    expect(component.serverError()).toBe('login.errors.noCard');
  });
});
