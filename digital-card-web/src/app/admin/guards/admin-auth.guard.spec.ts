import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { adminAuthGuard } from './admin-auth.guard';

describe('adminAuthGuard', () => {
  let auth: { adminMe: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = { adminMe: jasmine.createSpy() };
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue('TREE' as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  const runGuard = () => TestBed.runInInjectionContext(() => adminAuthGuard({} as any, {} as any));

  it('returns true when adminMe succeeds', (done) => {
    auth.adminMe.and.returnValue(of({}));
    (runGuard() as any).subscribe((res: any) => {
      expect(res).toBeTrue();
      done();
    });
  });

  it('redirects to /login on 401', (done) => {
    auth.adminMe.and.returnValue(throwError(() => ({ status: 401 })));
    (runGuard() as any).subscribe((res: any) => {
      expect(res).toBe('TREE');
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('redirects to /login on any other error', (done) => {
    auth.adminMe.and.returnValue(throwError(() => ({ status: 500 })));
    (runGuard() as any).subscribe((res: any) => {
      expect(res).toBe('TREE');
      done();
    });
  });
});
