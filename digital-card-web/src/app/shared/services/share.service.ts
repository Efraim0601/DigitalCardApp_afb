import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShareService {
  async copyText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  downloadFile(file: Blob, fileName: string): void {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async shareUrl(data: { title?: string; text?: string; url: string }): Promise<'shared' | 'copied'> {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return 'shared';
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          return 'shared';
        }
      }
    }

    await this.copyText(data.url);
    return 'copied';
  }

  async shareFiles(
    files: File[],
    data: { title?: string; text?: string }
  ): Promise<'shared' | 'downloaded'> {
    const canShareFiles =
      typeof navigator.canShare === 'function'
        ? navigator.canShare({ files })
        : typeof navigator.share === 'function';

    if (canShareFiles) {
      try {
        await navigator.share({ ...data, files });
        return 'shared';
      } catch (error) {
        const name = (error as Error)?.name;
        if (name === 'AbortError') return 'shared';
        // Any other error (NotAllowedError, TypeError on unsupported files) → fallback to download.
      }
    }

    for (const file of files) {
      this.downloadFile(file, file.name);
    }
    return 'downloaded';
  }
}