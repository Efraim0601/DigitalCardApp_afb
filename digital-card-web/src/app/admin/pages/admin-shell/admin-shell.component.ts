import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, switchMap, timer } from 'rxjs';
import { AdminService } from '../../../shared/services/admin.service';
import { AuthService } from '../../../shared/services/auth.service';
import { LanguageService } from '../../../shared/services/language.service';
import { ThemeService } from '../../../shared/services/theme.service';

/** How often (ms) the admin shell refreshes the pending-validation badge. */
const PENDING_POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './admin-shell.component.html'
})
export class AdminShellComponent implements OnInit {
  /** Number of cards awaiting validation, shown as a badge on the Cards tab. */
  readonly pendingCount = signal(0);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly auth: AuthService,
    private readonly admin: AdminService,
    readonly lang: LanguageService,
    readonly theme: ThemeService
  ) {}

  ngOnInit(): void {
    timer(0, PENDING_POLL_INTERVAL_MS)
      .pipe(
        switchMap(() =>
          this.admin.pendingCount().pipe(catchError(() => of({ count: this.pendingCount() })))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.pendingCount.set(res.count));
  }

  logout() {
    this.auth.adminLogout().subscribe({
      error: () => {
        // ignore (cookie might already be gone)
      }
    });
  }
}

