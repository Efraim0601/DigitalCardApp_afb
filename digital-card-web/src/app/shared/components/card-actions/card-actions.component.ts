import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, ViewChild, computed, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Card } from '../../models/card.model';
import { CardsService } from '../../services/cards.service';
import { ShareService } from '../../services/share.service';
import { BusinessCardComponent } from '../business-card/business-card.component';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { SharePopoverComponent } from '../share-popover/share-popover.component';

@Component({
  selector: 'app-card-actions',
  standalone: true,
  imports: [CommonModule, TranslateModule, QrCodeComponent, SharePopoverComponent],
  templateUrl: './card-actions.component.html',
  styleUrl: './card-actions.component.css'
})
export class CardActionsComponent {
  @Input({ required: true }) card!: Card;
  @Input() isCreator = false;
  @Input() publicUrl = '';
  @Input() employeeUrl = '';
  @Input() businessCard: BusinessCardComponent | null = null;

  @ViewChild('qrCode') qrCode?: QrCodeComponent;

  readonly sharePopoverOpen = signal(false);
  readonly qrPopoverOpen = signal(false);
  readonly busy = signal(false);
  readonly toastMessage = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly fullName = computed(() => {
    const first = (this.card?.firstName || '').trim();
    const last = (this.card?.lastName || '').trim();
    return `${first} ${last}`.trim() || this.card?.email || '';
  });

  constructor(
    private readonly shareService: ShareService,
    private readonly translate: TranslateService,
    private readonly cardsService: CardsService
  ) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closePopovers();
  }

  toggleShare(event: MouseEvent): void {
    event.stopPropagation();
    const next = !this.sharePopoverOpen();
    this.sharePopoverOpen.set(next);
    if (next) this.qrPopoverOpen.set(false);
  }

  toggleQr(event: MouseEvent): void {
    event.stopPropagation();
    const next = !this.qrPopoverOpen();
    this.qrPopoverOpen.set(next);
    if (next) this.sharePopoverOpen.set(false);
  }

  closePopovers(): void {
    this.sharePopoverOpen.set(false);
    this.qrPopoverOpen.set(false);
  }

  async shareCardImage(): Promise<void> {
    if (!this.businessCard) return;
    await this.runBusy(async () => {
      const file = await this.businessCard!.getCardImageFile();
      const result = await this.shareService.shareFiles([file], {
        title: this.shareTitle(),
        text: this.shareText()
      });
      this.showToast(result === 'shared' ? 'toast.shared' : 'toast.imageDownloaded');
      await this.incrementShareCount();
      this.closePopovers();
    });
  }

  async shareCardLink(): Promise<void> {
    if (!this.publicUrl) return;
    const result = await this.shareService.shareUrl({
      title: this.shareTitle(),
      text: this.shareText(),
      url: this.publicUrl
    });
    this.showToast(result === 'shared' ? 'toast.shared' : 'toast.linkCopied');
    await this.incrementShareCount();
    this.closePopovers();
  }

  async shareQRCode(): Promise<void> {
    const file = await this.qrCode?.getQRAsFile();
    if (!file) return;
    const result = await this.shareService.shareFiles([file], {
      title: this.shareTitle(),
      text: this.shareText()
    });
    this.showToast(result === 'shared' ? 'toast.shared' : 'toast.imageDownloaded');
    await this.incrementShareCount();
    this.closePopovers();
  }

  async copyEmployeeLink(): Promise<void> {
    if (!this.employeeUrl) return;
    const result = await this.shareService.shareUrl({
      title: this.shareTitle(),
      text: this.shareText(),
      url: this.employeeUrl
    });
    this.showToast(result === 'shared' ? 'toast.shared' : 'toast.linkCopied');
    await this.incrementShareCount();
    this.closePopovers();
  }

  async downloadCardImage(): Promise<void> {
    if (!this.businessCard) return;
    await this.runBusy(async () => {
      const file = await this.businessCard!.getCardImageFile();
      this.shareService.downloadFile(file, file.name);
      this.showToast('toast.imageDownloaded');
    });
  }

  call(): void {
    const phone = this.card.mobile || this.card.phone;
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  }

  email(): void {
    if (!this.card.email) return;
    window.location.href = `mailto:${this.card.email}`;
  }

  saveContact(): void {
    void this.qrCode?.downloadVCard();
  }

  private shareTitle(): string {
    return this.fullName()
      ? this.translate.instant('share.cardTitle', { name: this.fullName() })
      : this.translate.instant('share.cardTitleDefault');
  }

  private shareText(): string {
    return this.fullName()
      ? this.translate.instant('share.discover', { name: this.fullName() })
      : this.translate.instant('share.discoverDefault');
  }

  private showToast(key: string): void {
    this.toastMessage.set(this.translate.instant(key));
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 2500);
  }

  private async runBusy(task: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    try {
      await task();
    } finally {
      this.busy.set(false);
    }
  }

  private async incrementShareCount(): Promise<void> {
    try {
      await this.cardsService.incrementShareCount(this.card.email).toPromise();
    } catch (error) {
      console.warn('Failed to increment share count:', error);
    }
  }
}
