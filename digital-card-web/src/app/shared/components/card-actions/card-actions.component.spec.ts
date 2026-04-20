import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { CardActionsComponent } from './card-actions.component';
import { ShareService } from '../../services/share.service';
import { CardsService } from '../../services/cards.service';

class ShareStub {
  shareFiles = jasmine.createSpy('shareFiles').and.returnValue(Promise.resolve('shared'));
  shareUrl = jasmine.createSpy('shareUrl').and.returnValue(Promise.resolve('shared'));
  downloadFile = jasmine.createSpy('downloadFile');
}
class CardsStub {
  incrementShareCount = jasmine.createSpy('inc').and.returnValue(of({ success: true }));
}

describe('CardActionsComponent', () => {
  let fixture: ComponentFixture<CardActionsComponent>;
  let component: CardActionsComponent;
  let share: ShareStub;
  let cards: CardsStub;

  beforeEach(async () => {
    share = new ShareStub();
    cards = new CardsStub();
    await TestBed.configureTestingModule({
      imports: [CardActionsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ShareService, useValue: share },
        { provide: CardsService, useValue: cards }
      ]
    }).compileComponents();
    const trans = TestBed.inject(TranslateService);
    spyOn(trans, 'instant').and.callFake((k: any) => `t(${k})`);

    fixture = TestBed.createComponent(CardActionsComponent);
    component = fixture.componentInstance;
    component.card = { id: '1', email: 'a@b.com', firstName: 'John', lastName: 'Doe', mobile: '1 2', phone: '3' } as any;
    component.publicUrl = 'https://x/y';
    component.employeeUrl = 'https://x/y?employee=1';
    fixture.detectChanges();
  });

  it('creates and computes fullName', () => {
    expect(component.fullName()).toBe('John Doe');
  });

  it('onDocumentClick closes popovers', () => {
    component.sharePopoverOpen.set(true);
    component.qrPopoverOpen.set(true);
    component.onDocumentClick();
    expect(component.sharePopoverOpen()).toBeFalse();
    expect(component.qrPopoverOpen()).toBeFalse();
  });

  it('toggleShare opens/closes and triggers preheat', () => {
    const ev = new MouseEvent('click');
    spyOn(ev, 'stopPropagation');
    component.qrPopoverOpen.set(true);
    component.toggleShare(ev);
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(component.sharePopoverOpen()).toBeTrue();
    expect(component.qrPopoverOpen()).toBeFalse();
    component.toggleShare(ev);
    expect(component.sharePopoverOpen()).toBeFalse();
  });

  it('toggleQr opens/closes', () => {
    const ev = new MouseEvent('click');
    component.sharePopoverOpen.set(true);
    component.toggleQr(ev);
    expect(component.qrPopoverOpen()).toBeTrue();
    expect(component.sharePopoverOpen()).toBeFalse();
    component.toggleQr(ev);
    expect(component.qrPopoverOpen()).toBeFalse();
  });

  it('shareCardImage uses prepared image & shows toast', async () => {
    const file = new File(['x'], 'f.png');
    component.businessCard = { getCardImageFile: () => Promise.resolve(file) } as any;
    await component.shareCardImage();
    expect(share.shareFiles).toHaveBeenCalled();
    expect(component.toastMessage()).toContain('toast.shared');
    expect(cards.incrementShareCount).toHaveBeenCalledWith('a@b.com');
  });

  it('shareCardImage falls back to downloaded toast', async () => {
    share.shareFiles.and.returnValue(Promise.resolve('downloaded'));
    component.businessCard = { getCardImageFile: () => Promise.resolve(new File(['x'], 'a.png')) } as any;
    await component.shareCardImage();
    expect(component.toastMessage()).toContain('toast.imageDownloaded');
  });

  it('shareCardLink no-op when publicUrl missing', async () => {
    component.publicUrl = '';
    await component.shareCardLink();
    expect(share.shareUrl).not.toHaveBeenCalled();
  });

  it('shareCardLink shares when url present', async () => {
    share.shareUrl.and.returnValue(Promise.resolve('copied'));
    await component.shareCardLink();
    expect(share.shareUrl).toHaveBeenCalled();
    expect(component.toastMessage()).toContain('toast.linkCopied');
  });

  it('shareQRCode skips when qr returns null', async () => {
    component.qrCode = { getQRAsFile: () => Promise.resolve(null) } as any;
    await component.shareQRCode();
    expect(share.shareFiles).not.toHaveBeenCalled();
  });

  it('shareQRCode shares when qr returns file', async () => {
    const file = new File(['x'], 'qr.png');
    component.qrCode = { getQRAsFile: () => Promise.resolve(file) } as any;
    await component.shareQRCode();
    expect(share.shareFiles).toHaveBeenCalled();
  });

  it('copyEmployeeLink no-op without employeeUrl', async () => {
    component.employeeUrl = '';
    await component.copyEmployeeLink();
    expect(share.shareUrl).not.toHaveBeenCalled();
  });

  it('copyEmployeeLink shares employee url', async () => {
    share.shareUrl.and.returnValue(Promise.resolve('shared'));
    await component.copyEmployeeLink();
    expect(share.shareUrl).toHaveBeenCalled();
  });

  it('downloadCardImage no-op without businessCard', async () => {
    component.businessCard = null;
    await component.downloadCardImage();
    expect(share.downloadFile).not.toHaveBeenCalled();
  });

  it('downloadCardImage downloads file', async () => {
    const file = new File(['x'], 'c.png');
    component.businessCard = { getCardImageFile: () => Promise.resolve(file) } as any;
    await component.downloadCardImage();
    expect(share.downloadFile).toHaveBeenCalledWith(file, 'c.png');
    expect(component.toastMessage()).toContain('toast.imageDownloaded');
  });

  it('call no-op when no phone', () => {
    component.card = { ...component.card, mobile: null, phone: null } as any;
    expect(() => component.call()).not.toThrow();
  });

  it('email no-op when no email', () => {
    component.card = { ...component.card, email: '' };
    expect(() => component.email()).not.toThrow();
  });

  it('email no-op when no email', () => {
    component.card = { ...component.card, email: '' };
    expect(() => component.email()).not.toThrow();
  });

  it('saveContact calls qrCode.downloadVCard', () => {
    const spy = jasmine.createSpy();
    component.qrCode = { downloadVCard: spy } as any;
    component.saveContact();
    expect(spy).toHaveBeenCalled();
  });

  it('increment failure is swallowed', async () => {
    cards.incrementShareCount.and.returnValue(throwError(() => new Error('x')));
    component.businessCard = { getCardImageFile: () => Promise.resolve(new File(['x'], 'a.png')) } as any;
    spyOn(console, 'warn');
    await component.shareCardImage();
    expect(console.warn).toHaveBeenCalled();
  });

  it('toast auto-clears', fakeAsync(() => {
    component.businessCard = { getCardImageFile: () => Promise.resolve(new File(['x'], 'a.png')) } as any;
    component.shareCardImage();
    tick(100);
    tick(2600);
    expect(component.toastMessage()).toBeNull();
  }));

  it('fullName falls back to email when no names', () => {
    component.card = { id: '1', email: 'only@e.com' } as any;
    expect(component.fullName()).toBe('only@e.com');
  });
});
