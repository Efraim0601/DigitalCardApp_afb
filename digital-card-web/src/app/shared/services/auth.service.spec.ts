import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loginHint maps isAdminEmail when present', (done) => {
    service.loginHint('a@b.com').subscribe((res) => {
      expect(res).toEqual({ isAdminEmail: true, hasCard: true });
      done();
    });
    const req = httpMock.expectOne((r) => r.url === '/api/auth/login-hint');
    expect(req.request.params.get('email')).toBe('a@b.com');
    req.flush({ isAdminEmail: true, hasCard: true });
  });

  it('loginHint falls back to adminEmail field', (done) => {
    service.loginHint('a').subscribe((res) => {
      expect(res.isAdminEmail).toBeTrue();
      expect(res.hasCard).toBeFalse();
      done();
    });
    httpMock.expectOne('/api/auth/login-hint?email=a').flush({ adminEmail: true, hasCard: false });
  });

  it('loginHint defaults isAdminEmail to false if missing', (done) => {
    service.loginHint('a').subscribe((res) => {
      expect(res.isAdminEmail).toBeFalse();
      done();
    });
    httpMock.expectOne('/api/auth/login-hint?email=a').flush({ hasCard: true });
  });

  it('adminLogin posts credentials', (done) => {
    service.adminLogin({ email: 'e', password: 'p' }).subscribe(() => done());
    const req = httpMock.expectOne('/api/auth/admin/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'e', password: 'p' });
    req.flush(null);
  });

  it('adminMe GETs /admin/me', (done) => {
    service.adminMe().subscribe(() => done());
    const req = httpMock.expectOne('/api/auth/admin/me');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('adminLogout posts empty body', (done) => {
    service.adminLogout().subscribe(() => done());
    const req = httpMock.expectOne('/api/auth/admin/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('updateAdminCredentials PUTs the payload', (done) => {
    const payload = { currentPassword: 'x', newEmail: 'n@e.com', newPassword: 'y' };
    service.updateAdminCredentials(payload).subscribe(() => done());
    const req = httpMock.expectOne('/api/auth/admin/credentials');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });
});
