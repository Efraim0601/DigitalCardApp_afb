import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../shared/services/auth.service';
import { LanguageService } from '../../../shared/services/language.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './admin-shell.component.html'
})
export class AdminShellComponent {
  constructor(
    private readonly auth: AuthService,
    readonly lang: LanguageService
  ) {}

  logout() {
    this.auth.adminLogout().subscribe({
      error: () => {
        // ignore (cookie might already be gone)
      }
    });
  }
}

