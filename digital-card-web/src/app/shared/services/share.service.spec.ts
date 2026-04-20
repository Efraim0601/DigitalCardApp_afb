import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';

describe('ShareService', () => {
  let service: ShareService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ShareService] });
    service = TestBed.inject(ShareService);
  });

  describe('copyText', () => {
    it('uses clipboard API when available', async () => {
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true
      });
      await service.copyText('hello');
      expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('falls back to textarea+execCommand when no clipboard', async () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
      await service.copyText('fallback');
      expect(execSpy).toHaveBeenCalledWith('copy');
    });
  });

  describe('downloadFile', () => {
    it('creates anchor and clicks', () => {
      const blob = new Blob(['x']);
      const createObjSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      const revokeSpy = spyOn(URL, 'revokeObjectURL');
      const clickSpy = jasmine.createSpy('click');
      const origCreate = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tag: string) => {
        const el = origCreate(tag) as HTMLAnchorElement;
        if (tag === 'a') el.click = clickSpy;
        return el;
      });
      jasmine.clock().install();
      service.downloadFile(blob, 'name.png');
      jasmine.clock().tick(200);
      jasmine.clock().uninstall();
      expect(createObjSpy).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith('blob:url');
    });
  });

  describe('shareUrl', () => {
    it("returns 'shared' when navigator.share resolves", async () => {
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      const res = await service.shareUrl({ url: 'u' });
      expect(res).toBe('shared');
    });

    it("returns 'shared' when AbortError thrown", async () => {
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(
        Promise.reject(Object.assign(new Error('abort'), { name: 'AbortError' }))
      );
      const res = await service.shareUrl({ url: 'u' });
      expect(res).toBe('shared');
    });

    it("falls back to copied when share errors", async () => {
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(
        Promise.reject(new Error('x'))
      );
      spyOn(service, 'copyText').and.returnValue(Promise.resolve());
      const res = await service.shareUrl({ url: 'u' });
      expect(res).toBe('copied');
    });

    it("copies when no navigator.share", async () => {
      (navigator as any).share = undefined;
      spyOn(service, 'copyText').and.returnValue(Promise.resolve());
      const res = await service.shareUrl({ url: 'u' });
      expect(res).toBe('copied');
      expect(service.copyText).toHaveBeenCalledWith('u');
    });
  });

  describe('shareFiles', () => {
    const file = new File(['x'], 'f.png');

    it("returns 'shared' when canShare & share resolves", async () => {
      (navigator as any).canShare = () => true;
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      const res = await service.shareFiles([file], {});
      expect(res).toBe('shared');
    });

    it('returns shared on AbortError', async () => {
      (navigator as any).canShare = () => true;
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(
        Promise.reject(Object.assign(new Error(), { name: 'AbortError' }))
      );
      const res = await service.shareFiles([file], {});
      expect(res).toBe('shared');
    });

    it('falls back to download on other errors', async () => {
      (navigator as any).canShare = () => true;
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(
        Promise.reject(new Error('fail'))
      );
      const dl = spyOn(service, 'downloadFile');
      const res = await service.shareFiles([file], {});
      expect(res).toBe('downloaded');
      expect(dl).toHaveBeenCalled();
    });

    it('downloads when canShare returns false', async () => {
      (navigator as any).canShare = () => false;
      const dl = spyOn(service, 'downloadFile');
      const res = await service.shareFiles([file], {});
      expect(res).toBe('downloaded');
      expect(dl).toHaveBeenCalled();
    });

    it('uses navigator.share presence when canShare is not a function', async () => {
      (navigator as any).canShare = undefined;
      (navigator as any).share = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      const res = await service.shareFiles([file], {});
      expect(res).toBe('shared');
    });
  });
});
