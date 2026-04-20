import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CardsService } from './cards.service';

describe('CardsService', () => {
  let service: CardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CardsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByEmail attaches email param', (done) => {
    service.getByEmail('a@b.c').subscribe(() => done());
    const req = httpMock.expectOne((r) => r.url === '/api/cards');
    expect(req.request.params.get('email')).toBe('a@b.c');
    req.flush({ id: '1', email: 'a@b.c' });
  });

  it('incrementShareCount encodes email in URL', (done) => {
    service.incrementShareCount('a+b@c.com').subscribe((res) => {
      expect(res.success).toBeTrue();
      done();
    });
    const req = httpMock.expectOne((r) => r.url === '/api/cards/increment-share/a%2Bb%40c.com');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });
});
