import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { toPng } from 'html-to-image';
import { Card, CardBackgroundConfig, CardBackgroundSize, CardPadding } from '../../models/card.model';
import { LanguageService } from '../../services/language.service';
import { nextPaint } from '../../utils/next-paint';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.css'
})
export class BusinessCardComponent implements AfterViewInit, OnDestroy {
  readonly cardWidth = 600;
  readonly cardHeight = 340;

  private static readonly DEFAULT_PADDING: CardPadding = { top: 113, right: 32, bottom: 20, left: 32 };
  private static readonly DEFAULT_BACKGROUND_SIZE: CardBackgroundSize = 'cover';

  @Input({ required: true }) card!: Card;
  @Input() config: CardBackgroundConfig = { cardBackground: 'assets/carte-digitale-bg.png' };

  @ViewChild('cardEl', { static: true }) cardEl!: ElementRef<HTMLElement>;
  @ViewChild('outerEl', { static: true }) outerEl!: ElementRef<HTMLElement>;

  readonly scale = signal(1);

  readonly resolvedPadding = computed<CardPadding>(
    () => this.config?.contentPadding ?? BusinessCardComponent.DEFAULT_PADDING
  );

  readonly resolvedBackgroundSize = computed<CardBackgroundSize>(
    () => this.config?.backgroundSize ?? BusinessCardComponent.DEFAULT_BACKGROUND_SIZE
  );

  readonly fullName = computed(() => {
    const f = (this.card?.firstName ?? '').trim();
    const l = (this.card?.lastName ?? '').trim();
    const name = `${f} ${l}`.trim();
    return name || this.card?.email || '';
  });

  readonly displayedTitle = computed(() => {
    const locale = this.lang.lang();
    return locale === 'en'
      ? this.card?.jobTitle?.labelEn || this.card?.title || '—'
      : this.card?.jobTitle?.labelFr || this.card?.title || '—';
  });

  readonly displayedDepartment = computed(() => {
    const locale = this.lang.lang();
    return locale === 'en'
      ? this.card?.department?.labelEn || this.card?.company || '—'
      : this.card?.department?.labelFr || this.card?.company || '—';
  });

  readonly fixedPhone = computed(() => this.card?.phone?.trim() || '222 233 068');
  readonly fixedFax = computed(() => this.card?.fax?.trim() || '222 221 785');
  readonly website = 'www.afrilandfirstbank.com';
  readonly websiteUrl = 'https://www.afrilandfirstbank.com';
  private resizeObserver?: ResizeObserver;

  constructor(private readonly lang: LanguageService) {}

  ngAfterViewInit(): void {
    this.startResizeTracking();
    this.recomputeScale();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    globalThis.window.visualViewport?.removeEventListener('resize', this.onVisualViewportResize);
    globalThis.window.visualViewport?.removeEventListener('scroll', this.onVisualViewportResize);
  }

  @HostListener('window:resize')
  onResize() {
    this.recomputeScale();
  }

  private onVisualViewportResize = () => {
    this.recomputeScale();
  };

  private startResizeTracking() {
    const host = this.outerEl.nativeElement.parentElement;
    if (host && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.recomputeScale());
      this.resizeObserver.observe(host);
    }

    globalThis.window.visualViewport?.addEventListener('resize', this.onVisualViewportResize);
    globalThis.window.visualViewport?.addEventListener('scroll', this.onVisualViewportResize);
  }

  private recomputeScale() {
    const hostWidth = this.outerEl.nativeElement.parentElement?.getBoundingClientRect().width ?? globalThis.window.innerWidth;
    const horizontalPadding = globalThis.window.innerWidth < 640 ? 8 : 24;
    const availableWidth = Math.max(240, hostWidth - horizontalPadding);

    // Keep sizing stable on mobile: width is the real constraint for this card layout.
    const byWidth = availableWidth / this.cardWidth;
    this.applyScale(Math.min(1, byWidth));
  }

  async getCardImageFile(): Promise<File> {
    const previousScale = this.scale();
    this.applyScale(1);
    await nextPaint();

    const pixelRatio = 2;
    const targetW = this.cardWidth * pixelRatio;
    const targetH = this.cardHeight * pixelRatio;

    try {
      await this.waitForBackgroundImage(this.config.cardBackground ?? undefined);
      await this.waitForImages(this.cardEl.nativeElement);
      const rawDataUrl = await toPng(this.cardEl.nativeElement, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: '#ffffff',
        width: this.cardWidth,
        height: this.cardHeight,
        canvasWidth: this.cardWidth,
        canvasHeight: this.cardHeight,
        style: { transform: 'none', margin: '0' }
      });
      const blob = await this.cropToExactSize(rawDataUrl, targetW, targetH);
      return new File([blob], this.buildImageFileName(), { type: 'image/png' });
    } finally {
      this.applyScale(previousScale);
      await nextPaint();
    }
  }

  private applyScale(scale: number) {
    this.scale.set(scale);

    const outer = this.outerEl.nativeElement;
    outer.style.height = `${this.cardHeight * scale}px`;
    outer.style.width = `${this.cardWidth * scale}px`;
  }

  /**
   * Re-draw the html-to-image output onto a canvas of the exact card size.
   * html-to-image inflates the bounding rect with the box-shadow on some
   * browsers, leaving a blank strip on the right of the captured PNG —
   * this crop guarantees the output is strictly cardWidth*pr × cardHeight*pr.
   */
  private async cropToExactSize(dataUrl: string, targetW: number, targetH: number): Promise<Blob> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Captured image failed to decode'));
      i.src = dataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH, 0, 0, targetW, targetH);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
        'image/png'
      );
    });
  }

  private async waitForBackgroundImage(url?: string): Promise<void> {
    if (!url?.trim()) return;

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
      if (img.complete) resolve();
    });
    await nextPaint();
  }

  private async waitForImages(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  }

  private buildImageFileName(): string {
    const ownerName = this.fullName() || this.card.email || '';
    const safe = ownerName.replaceAll(/[^a-z0-9_.\- ]/gi, '_').trim() || 'carte';
    return `Carte de ${safe}.png`;
  }

  telHref(value: string | null | undefined): string {
    return `tel:${(value || '').replaceAll(/\s+/g, '')}`;
  }
}

