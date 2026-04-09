import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { toPng } from 'html-to-image';
import { QRCodeModule } from 'angularx-qrcode';
import { Card, CardBackgroundConfig } from '../../models/card.model';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, QRCodeModule],
  templateUrl: './business-card.component.html'
})
export class BusinessCardComponent implements AfterViewInit {
  @Input({ required: true }) card!: Card;
  @Input() isCreator = false;
  @Input() config: CardBackgroundConfig = { cardBackground: 'assets/carte-digitale-bg.png' };

  @ViewChild('cardEl', { static: true }) cardEl!: ElementRef<HTMLElement>;
  @ViewChild('outerEl', { static: true }) outerEl!: ElementRef<HTMLElement>;

  readonly scale = signal(1);
  readonly shareOpen = signal(false);
  readonly qrOpen = signal(false);
  readonly isDownloading = signal(false);

  readonly fullName = computed(() => {
    const f = (this.card?.firstName ?? '').trim();
    const l = (this.card?.lastName ?? '').trim();
    const name = `${f} ${l}`.trim();
    return name || this.card?.email || '';
  });

  readonly cardUrl = computed(() => {
    const url = new URL(window.location.origin);
    url.pathname = '/card';
    url.searchParams.set('email', this.card?.email ?? '');
    return url.toString();
  });

  ngAfterViewInit(): void {
    this.recomputeScale();
  }

  @HostListener('window:resize')
  onResize() {
    this.recomputeScale();
  }

  private recomputeScale() {
    const available = Math.max(280, window.innerWidth - 32);
    const scale = Math.min(1, available / 600);
    this.scale.set(scale);

    const outer = this.outerEl.nativeElement;
    outer.style.height = `${340 * scale}px`;
    outer.style.width = `${600 * scale}px`;
  }

  closePopovers() {
    this.shareOpen.set(false);
    this.qrOpen.set(false);
  }

  toggleShare() {
    const next = !this.shareOpen();
    this.shareOpen.set(next);
    if (next) this.qrOpen.set(false);
  }

  toggleQr() {
    const next = !this.qrOpen();
    this.qrOpen.set(next);
    if (next) this.shareOpen.set(false);
  }

  async share() {
    await this.shareCardLink();
  }

  private async makeCardPngBlob(): Promise<Blob> {
    const dataUrl = await toPng(this.cardEl.nativeElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  async shareCardImage() {
    this.isDownloading.set(true);
    try {
      const pngBlob = await this.makeCardPngBlob();
      const file = new File(
        [pngBlob],
        `${(this.card.email || 'business-card').replace(/[^a-z0-9_.-]/gi, '_')}.png`,
        { type: 'image/png' }
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: this.fullName() });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      this.closePopovers();
    } finally {
      this.isDownloading.set(false);
    }
  }

  async shareCardLink() {
    const url = this.cardUrl();
    const title = this.fullName();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        this.closePopovers();
        return;
      }
    } catch {
      // ignore, fallback below
    }
    await navigator.clipboard.writeText(url);
    this.closePopovers();
  }

  openQrFromShare() {
    this.shareOpen.set(false);
    this.qrOpen.set(true);
  }

  async downloadPng() {
    this.isDownloading.set(true);
    try {
      const dataUrl = await toPng(this.cardEl.nativeElement, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${(this.card.email || 'business-card').replace(/[^a-z0-9_.-]/gi, '_')}.png`;
      a.click();
    } finally {
      this.isDownloading.set(false);
    }
  }

  call() {
    window.location.href = 'tel:222233068';
  }

  email() {
    window.location.href = `mailto:${this.card?.email ?? ''}`;
  }

  downloadVcf() {
    const vcf = this.buildVcf();
    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(this.card.email || 'contact').replace(/[^a-z0-9_.-]/gi, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private buildVcf() {
    const f = (this.card?.firstName ?? '').trim();
    const l = (this.card?.lastName ?? '').trim();
    const n = `${l};${f};;;`;
    const fn = this.fullName();
    const org = 'Afriland First Bank';
    const title = (this.card?.title ?? '').trim();
    const dept = (this.card?.department?.labelFr ?? '').trim();
    const mobile = (this.card?.mobile ?? '').trim();
    const email = (this.card?.email ?? '').trim();
    const url = 'https://www.afrilandfirstbank.com';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${this.escapeVcf(n)}`,
      `FN:${this.escapeVcf(fn)}`,
      `ORG:${this.escapeVcf(org)}${dept ? ';' + this.escapeVcf(dept) : ''}`,
      title ? `TITLE:${this.escapeVcf(title)}` : '',
      email ? `EMAIL;TYPE=INTERNET:${this.escapeVcf(email)}` : '',
      mobile ? `TEL;TYPE=CELL:${this.escapeVcf(mobile)}` : '',
      'TEL;TYPE=WORK:222233068',
      'TEL;TYPE=FAX:222221785',
      `URL:${url}`,
      'END:VCARD'
    ].filter(Boolean);

    return lines.join('\r\n') + '\r\n';
  }

  private escapeVcf(v: string) {
    return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
}

