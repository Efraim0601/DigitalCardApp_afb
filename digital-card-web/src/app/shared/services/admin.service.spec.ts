import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('export sends scope and returns blob', (done) => {
    service.export('cards').subscribe((blob) => {
      expect(blob).toBeTruthy();
      done();
    });
    const req = httpMock.expectOne((r) => r.url === '/api/admin/data-export');
    expect(req.request.params.get('scope')).toBe('cards');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['ok']));
  });

  it('import posts FormData with scope', (done) => {
    const file = new File(['data'], 'f.csv');
    service.import('departments', file).subscribe(() => done());
    const req = httpMock.expectOne((r) => r.url === '/api/admin/data-import');
    expect(req.request.params.get('scope')).toBe('departments');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush(null);
  });

  it('listCards applies q when set', (done) => {
    service.listCards({ q: 'john', limit: 10, offset: 5 }).subscribe(() => done());
    const req = httpMock.expectOne((r) => r.url === '/api/cards');
    expect(req.request.params.get('q')).toBe('john');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('offset')).toBe('5');
    req.flush({ items: [], total: 0, limit: 10, offset: 5 });
  });

  it('listCards omits q when empty', (done) => {
    service.listCards({ limit: 10, offset: 0 }).subscribe(() => done());
    const req = httpMock.expectOne((r) => r.url === '/api/cards');
    expect(req.request.params.has('q')).toBeFalse();
    req.flush({ items: [], total: 0, limit: 10, offset: 0 });
  });

  it('createOrUpsertCard posts payload', (done) => {
    service.createOrUpsertCard({ email: 'x@x.com' }).subscribe(() => done());
    const req = httpMock.expectOne('/api/cards');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'x@x.com' });
    req.flush({ id: '1', email: 'x@x.com' });
  });

  it('bulkDeleteCards posts ids', (done) => {
    service.bulkDeleteCards(['a', 'b']).subscribe((res) => {
      expect(res.success).toBeTrue();
      done();
    });
    const req = httpMock.expectOne('/api/cards/bulk-delete');
    expect(req.request.body).toEqual({ ids: ['a', 'b'] });
    req.flush({ success: true, deleted: 2 });
  });

  it('listDepartments with and without q', () => {
    service.listDepartments({ q: 'x', limit: 1, offset: 0 }).subscribe();
    const r1 = httpMock.expectOne((r) => r.url === '/api/departments');
    expect(r1.request.params.get('q')).toBe('x');
    r1.flush({ items: [], total: 0, limit: 1, offset: 0 });

    service.listDepartments({ limit: 1, offset: 0 }).subscribe();
    const r2 = httpMock.expectOne((r) => r.url === '/api/departments');
    expect(r2.request.params.has('q')).toBeFalse();
    r2.flush({ items: [], total: 0, limit: 1, offset: 0 });
  });

  it('createDepartment & deleteDepartment', (done) => {
    service.createDepartment({ labelFr: 'fr', labelEn: 'en' }).subscribe();
    httpMock.expectOne('/api/departments').flush({ id: '1', labelFr: 'fr', labelEn: 'en' });
    service.deleteDepartment('1').subscribe(() => done());
    const del = httpMock.expectOne('/api/departments/1');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });

  it('listJobTitles with and without q', () => {
    service.listJobTitles({ q: 'x', limit: 1, offset: 0 }).subscribe();
    const r1 = httpMock.expectOne((r) => r.url === '/api/job-titles');
    expect(r1.request.params.get('q')).toBe('x');
    r1.flush({ items: [], total: 0, limit: 1, offset: 0 });
    service.listJobTitles({ limit: 1, offset: 0 }).subscribe();
    const r2 = httpMock.expectOne((r) => r.url === '/api/job-titles');
    expect(r2.request.params.has('q')).toBeFalse();
    r2.flush({ items: [], total: 0, limit: 1, offset: 0 });
  });

  it('createJobTitle and deleteJobTitle', (done) => {
    service.createJobTitle({ labelFr: 'fr', labelEn: 'en' }).subscribe();
    const post = httpMock.expectOne('/api/job-titles');
    expect(post.request.method).toBe('POST');
    post.flush({ id: '1', labelFr: 'fr', labelEn: 'en' });
    service.deleteJobTitle('1').subscribe(() => done());
    const del = httpMock.expectOne('/api/job-titles/1');
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });

  it('smtp endpoints', (done) => {
    service.getSmtpSettings().subscribe();
    httpMock.expectOne('/api/admin/smtp-settings').flush({
      enabled: false, host: null, port: 587, username: null, hasPassword: false,
      protocol: 'smtp', auth: true, starttlsEnabled: true, sslEnabled: false,
      fromEmail: null, fromName: null, updatedAt: null
    });

    service.updateSmtpSettings({
      enabled: true, host: 'h', port: 25, username: 'u',
      protocol: 'smtp', auth: true, starttlsEnabled: true, sslEnabled: false,
      fromEmail: 'f@e', fromName: 'F'
    }).subscribe();
    const put = httpMock.expectOne('/api/admin/smtp-settings');
    expect(put.request.method).toBe('PUT');
    put.flush({} as any);

    service.sendSmtpTestEmail('to@e.com').subscribe((r) => {
      expect(r.success).toBeTrue();
      done();
    });
    httpMock.expectOne('/api/admin/smtp-settings/test').flush({ success: true });
  });
});
