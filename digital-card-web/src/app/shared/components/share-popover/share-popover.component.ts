import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-share-popover',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './share-popover.component.html'
})
export class SharePopoverComponent {
  @Input() isOpen = false;
  @Input() isBusy = false;
  @Input() isCreator = false;

  @Output() shareImage = new EventEmitter<void>();
  @Output() shareLink = new EventEmitter<void>();
  @Output() shareQr = new EventEmitter<void>();
  @Output() copyEmployeeLink = new EventEmitter<void>();
}
