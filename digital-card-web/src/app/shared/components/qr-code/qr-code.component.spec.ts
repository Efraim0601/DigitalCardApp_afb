import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrCodeComponent } from './qr-code.component';
import { ShareService } from '../../services/share.service';

class ShareServiceStub {
  downloadFile = jasmine.createSpy('downloadFile');
}

describe('QrCodeComponent', () => {
  let fixture: ComponentFixture<QrCodeComponent>;
  let component: QrCodeComponent;
  let share: ShareServiceStub;

  beforeEach(async () => {
    share = new ShareServiceStub();
    await TestBed.configureTestingModule({
      imports: [QrCodeComponent],
      providers: [{ provide: ShareService, useValue: share }]
    }).compileComponents();
    fixture = TestBed.createComponent(QrCodeComponent);
    component = fixture.componentInstance;
    component.url = 'https://x/y';
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('getQRAsFile returns null when no SVG present', async () => {
    const host = document.createElement('div');
    spyOn(component.qrHost.nativeElement, 'querySelector').and.returnValue(null);
    expect(await component.getQRAsFile()).toBeNull();
  });

  it('downloadVCard no-op when card is null', async () => {
    component.card = null;
    await component.downloadVCard();
    expect(share.downloadFile).not.toHaveBeenCalled();
  });

  it('downloadVCard downloads when no navigator.share', async () => {
    (navigator as any).share = undefined;
    component.card = {
      id: '1', email: 'a@b.com', firstName: 'John', lastName: 'Doe',
      company: 'C', department: { id: 'd', labelFr: 'Dir', labelEn: 'Dept' },
      jobTitle: null, title: 'T', phone: '1', fax: '2', mobile: '3'
    };
    await component.downloadVCard();
    expect(share.downloadFile).toHaveBeenCalled();
  });

  it('downloadVCard with full data when navigator.share cannot share files', async () => {
    (navigator as any).share = jasmine.createSpy();
    (navigator as any).canShare = () => false;
    component.card = {
      id: '1', email: 'a@b.com', firstName: 'Jane', lastName: 'D',
      company: null, department: null, jobTitle: null,
      title: null, phone: null, fax: null, mobile: null
    };
    await component.downloadVCard();
    expect(share.downloadFile).toHaveBeenCalled();
  });

  it('downloadVCard returns on AbortError without downloading', async () => {
    (navigator as any).canShare = () => true;
    (navigator as any).share = jasmine.createSpy('share').and.returnValue(
      Promise.reject(Object.assign(new Error(), { name: 'AbortError' }))
    );
    component.card = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B' };
    await component.downloadVCard();
    expect(share.downloadFile).not.toHaveBeenCalled();
  });

  it('downloadVCard shares successfully', async () => {
    (navigator as any).canShare = () => true;
    (navigator as any).share = jasmine.createSpy('share').and.returnValue(Promise.resolve());
    component.card = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B' };
    await component.downloadVCard();
    expect(share.downloadFile).not.toHaveBeenCalled();
  });
});
