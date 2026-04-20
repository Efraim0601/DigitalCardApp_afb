import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  let fixture: ComponentFixture<AdminShellComponent>;
  let component: AdminShellComponent;
  let auth: { adminLogout: jasmine.Spy };

  beforeEach(async () => {
    auth = { adminLogout: jasmine.createSpy('adminLogout').and.returnValue(of(null)) };
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: auth },
        provideRouter([])
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('logout calls adminLogout', () => {
    component.logout();
    expect(auth.adminLogout).toHaveBeenCalled();
  });

  it('logout swallows errors', () => {
    auth.adminLogout.and.returnValue(throwError(() => new Error('x')));
    expect(() => component.logout()).not.toThrow();
  });
});
