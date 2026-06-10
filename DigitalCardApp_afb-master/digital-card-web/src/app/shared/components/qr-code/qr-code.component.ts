import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { QRCodeModule } from 'angularx-qrcode';
import VCard from 'vcard-creator';
import { Card } from '../../models/card.model';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  templateUrl: './qr-code.component.html'
})
export class QrCodeComponent {
  @Input({ required: true }) url = '';
  @Input() card: Card | null = null;

  @ViewChild('qrHost', { static: true }) qrHost!: ElementRef<HTMLElement>;

  constructor(private readonly shareService: ShareService) {}

  async getQRAsFile(): Promise<File | null> {
    const svg = this.qrHost.nativeElement.querySelector('svg');
    if (!svg) return null;

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svg);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = await this.loadImage(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), 'image/png', 1);
      });

      return pngBlob ? new File([pngBlob], 'qr-code-carte.png', { type: 'image/png' }) : null;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async downloadVCard(): Promise<void> {
    if (!this.card) return;

    const vcard = new VCard();
    vcard.addName({
      familyName: this.card.lastName || '',
      givenName: this.card.firstName || ''
    });

    if (this.card.company || this.card.department?.labelFr || this.card.department?.labelEn) {
      vcard.addCompany({
        name: this.card.company || 'Afriland First Bank',
        department: this.card.department?.labelFr || this.card.department?.labelEn || ''
      });
    }
    if (this.card.title) vcard.addJobtitle(this.card.title);
    if (this.card.email) vcard.addEmail({ address: this.card.email, type: ['internet', 'work'] });
    if (this.card.phone) vcard.addPhoneNumber({ number: this.card.phone, type: ['work', 'voice'] });
    if (this.card.fax) vcard.addPhoneNumber({ number: this.card.fax, type: ['work', 'fax'] });
    if (this.card.mobile) vcard.addPhoneNumber({ number: this.card.mobile, type: ['cell'] });

    const blob = new Blob([vcard.toString()], { type: 'text/vcard;charset=utf-8' });
    const fileName = `${(this.card.firstName || 'contact').replaceAll(/[^a-z0-9_.-]/gi, '_')}_${(this.card.lastName || 'card').replaceAll(/[^a-z0-9_.-]/gi, '_')}.vcf`;
    const file = new File([blob], fileName, { type: 'text/vcard;charset=utf-8' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${this.card.firstName || ''} ${this.card.lastName || ''}`.trim() });
        return;
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
      }
    }

    this.shareService.downloadFile(blob, fileName);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to render QR image'));
      img.src = src;
    });
  }
}