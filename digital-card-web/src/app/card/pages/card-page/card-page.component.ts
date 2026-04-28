import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { BusinessCardComponent } from '../../../shared/components/business-card/business-card.component';
import { CardActionsComponent } from '../../../shared/components/card-actions/card-actions.component';
import { CARD_TEMPLATES, getTemplate } from '../../../shared/models/card-templates';
import { Card, CardBackgroundConfig, TemplateId } from '../../../shared/models/card.model';
import { CardsService, PublicAppearanceSettings } from '../../../shared/services/cards.service';
import { LanguageService } from '../../../shared/services/language.service';
import { ThemeService } from '../../../shared/services/theme.service';
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
  readonly templates = CARD_TEMPLATES;
  readonly isLoading = signal(true);
  readonly errorKey = signal<string | null>(null);
  readonly card = signal<Card | null>(null);
  readonly publicUrl = signal('');
  readonly employeeUrl = signal('');
  readonly isCreator = signal(false);

  readonly appearance = signal<PublicAppearanceSettings>({
    allowUserTemplate: false,
    defaultTemplate: 'classic'
  });
  readonly selectedTemplateId = signal<TemplateId>('classic');
  readonly templatePickerSaving = signal(false);
  readonly templatePickerError = signal<string | null>(null);

  readonly canChooseTemplate = computed(
    () => this.appearance().allowUserTemplate && this.card() !== null
  );

  readonly currentTemplate = computed(() => getTemplate(this.selectedTemplateId()));

  readonly cardConfig = computed<CardBackgroundConfig>(() => {
    const tpl = this.currentTemplate();
    return {
      cardBackground: tpl.background,
      contentPadding: tpl.contentPadding,
      backgroundSize: tpl.backgroundSize
    };
  });

  readonly email = computed(() => this.route.snapshot.queryParamMap.get('email') ?? '');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cards: CardsService,
    readonly lang: LanguageService,
    readonly theme: ThemeService
  ) {
    this.cards
      .getAppearanceSettings()
      .pipe(catchError(() => of(null)))
      .subscribe((settings) => {
        if (settings) {
          this.appearance.set({
            allowUserTemplate: !!settings.allowUserTemplate,
            defaultTemplate: settings.defaultTemplate ?? 'classic'
          });
          this.applyTemplateFromState();
        }
      });

    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const email = params.get('email') ?? '';
          const query: Record<string, string | string[] | undefined> = {};
          for (const key of params.keys) {
            const values = params.getAll(key);
            query[key] = values.length > 1 ? values : values[0];
          }

          if (globalThis.window !== undefined) {
            const publicUrl = buildPublicCardUrl(
              globalThis.window.location.origin,
              '/card',
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
        if (card) {
          this.card.set(card);
          this.applyTemplateFromState();
        }
      });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  selectTemplate(id: TemplateId) {
    if (!this.canChooseTemplate()) return;
    if (id === this.selectedTemplateId()) return;
    const card = this.card();
    if (!card) return;

    const previous = this.selectedTemplateId();
    this.selectedTemplateId.set(id);
    this.templatePickerError.set(null);
    this.templatePickerSaving.set(true);

    this.cards
      .updateTemplate(card.email, id)
      .pipe(
        catchError((err: { error?: { error?: string } }) => {
          this.selectedTemplateId.set(previous);
          this.templatePickerError.set(err?.error?.error ?? 'card.errors.templateSaveError');
          return of(null);
        }),
        finalize(() => this.templatePickerSaving.set(false))
      )
      .subscribe((updated) => {
        if (!updated) return;
        this.card.set({ ...card, templateId: updated.templateId ?? id });
      });
  }

  /** Resolve the active template using the same priority as the cardyo backend:
   * if the admin allows user choice and the card has a saved templateId, use it; otherwise fall back to the admin default. */
  private applyTemplateFromState() {
    const settings = this.appearance();
    const card = this.card();
    if (settings.allowUserTemplate && card?.templateId) {
      this.selectedTemplateId.set(card.templateId as TemplateId);
    } else {
      this.selectedTemplateId.set(settings.defaultTemplate ?? 'classic');
    }
  }
}
