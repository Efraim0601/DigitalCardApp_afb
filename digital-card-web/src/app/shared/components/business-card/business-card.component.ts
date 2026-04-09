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
import { Card, CardBackgroundConfig } from '../../models/card.model';
import { LanguageService } from '../../services/language.service';
import { nextPaint } from '../../utils/next-paint';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.css'
})
export class BusinessCardComponent implements AfterViewInit {
  readonly cardWidth = 600;
  readonly cardHeight = 340;

  @Input({ required: true }) card!: Card;
  @Input() config: CardBackgroundConfig = { cardBackground: 'assets/carte-digitale-bg.png' };

  @ViewChild('cardEl', { static: true }) cardEl!: ElementRef<HTMLElement>;
  @ViewChild('outerEl', { static: true }) outerEl!: ElementRef<HTMLElement>;

  readonly scale = signal(1);

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

  constructor(private readonly lang: LanguageService) {}

  ngAfterViewInit(): void {
    this.recomputeScale();
  }

  @HostListener('window:resize')
  onResize() {
    this.recomputeScale();
  }

  private recomputeScale() {
    const horizontalPadding = window.innerWidth < 640 ? 24 : 48;
    const verticalReserve = window.innerWidth < 640 ? 320 : 240;

    const availableWidth = Math.max(280, window.innerWidth - horizontalPadding);
    const availableHeight = Math.max(160, window.innerHeight - verticalReserve);

    const byWidth = availableWidth / this.cardWidth;
    const byHeight = availableHeight / this.cardHeight;
    this.applyScale(Math.min(1, byWidth, byHeight));
  }

  async getCardImageFile(): Promise<File> {
    const previousScale = this.scale();
    this.applyScale(1);
    await nextPaint();

    try {
      await this.waitForBackgroundImage(this.config.cardBackground ?? undefined);
      await this.waitForImages(this.cardEl.nativeElement);
      const dataUrl = await toPng(this.cardEl.nativeElement, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
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
    const base = (this.fullName() || this.card.email || 'business-card').replace(/[^a-z0-9_.-]/gi, '_');
    return `${base}.png`;
  }

  telHref(value: string | null | undefined): string {
    return `tel:${(value || '').replace(/\s+/g, '')}`;
  }
}

