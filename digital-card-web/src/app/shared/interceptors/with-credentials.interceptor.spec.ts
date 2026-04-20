import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';
import { withCredentialsInterceptor } from './with-credentials.interceptor';

describe('withCredentialsInterceptor', () => {
  it('passes through when withCredentials already true', (done) => {
    const req = new HttpRequest('GET', '/api/x', null, { withCredentials: true });
    const next: HttpHandlerFn = (r) => {
      expect(r.withCredentials).toBeTrue();
      expect(r).toBe(req);
      return of({} as any);
    };
    withCredentialsInterceptor(req, next).subscribe(() => done());
  });

  it('clones request with withCredentials=true when not set', (done) => {
    const req = new HttpRequest('GET', '/api/x');
    const next: HttpHandlerFn = (r) => {
      expect(r.withCredentials).toBeTrue();
      expect(r).not.toBe(req);
      return of({} as any);
    };
    withCredentialsInterceptor(req, next).subscribe(() => done());
  });
});
