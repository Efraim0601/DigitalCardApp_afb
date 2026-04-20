import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { BusinessCardComponent } from '../../../shared/components/business-card/business-card.component';
import { CardActionsComponent } from '../../../shared/components/card-actions/card-actions.component';
import { Card } from '../../../shared/models/card.model';
import { CardsService } from '../../../shared/services/cards.service';
import { LanguageService } from '../../../shared/services/language.service';
import { buildPublicCardUrl, withEmployeeQuery } from '../../../shared/utils/card-urls';

@Component({
  selector: 'app-card-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, BusinessCardComponent, CardActionsComponent],
  templateUrl: './card-page.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CardPageComponent {
  readonly isLoading = signal(true);
  readonly errorKey = signal<string | null>(null);
  readonly card = signal<Card | null>(null);
  readonly publicUrl = signal('');
  readonly employeeUrl = signal('');
  readonly isCreator = signal(false);

  readonly email = computed(() => this.route.snapshot.queryParamMap.get('email') ?? '');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cards: CardsService,
    readonly lang: LanguageService
  ) {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const email = params.get('email') ?? '';
          const query: Record<string, string | string[] | undefined> = {};
          for (const key of params.keys) {
            const values = params.getAll(key);
            query[key] = values.length > 1 ? values : values[0];
          }

          if (typeof globalThis.window !== 'undefined') {
            const publicUrl = buildPublicCardUrl(
              globalThis.window.location.origin,
              this.router.url.split('?')[0] || '/card',
              query
            );
            this.publicUrl.set(publicUrl);
            this.employeeUrl.set(withEmployeeQuery(publicUrl));
          }

          this.isCreator.set(params.get('owner') === '1' && params.get('employee') !== '1');

          if (!email) {
            this.errorKey.set('card.errors.missingEmail');
            this.isLoading.set(false);
            return of(null);
          }

          this.isLoading.set(true);
          this.errorKey.set(null);
          this.card.set(null);

          return this.cards.getByEmail(email).pipe(
            catchError(() => {
              this.errorKey.set('card.errors.notFound');
              return of(null);
            }),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe((card) => {
        if (card) this.card.set(card);
      });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
