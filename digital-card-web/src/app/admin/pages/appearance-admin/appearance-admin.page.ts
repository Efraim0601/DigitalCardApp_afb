import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, of } from 'rxjs';
import { CARD_TEMPLATES } from '../../../shared/models/card-templates';
import { TemplateId } from '../../../shared/models/card.model';
import { AdminService, AppearanceSettingsUpdatePayload } from '../../../shared/services/admin.service';

type AppearanceForm = {
  allowUserTemplate: FormControl<boolean>;
  defaultTemplate: FormControl<TemplateId>;
};

@Component({
  selector: 'app-appearance-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="space-y-5">
      <div class="max-w-[900px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-[17px] font-semibold text-slate-900">{{ 'admin.appearance.title' | translate }}</h2>
        <p class="mt-2 text-sm leading-[1.55] text-slate-500">
          {{ 'admin.appearance.description' | translate }}
        </p>

        @if (error()) {
          <p class="mt-3 text-sm text-[#d32f2f]">{{ error()! | translate }}</p>
        }
        @if (success()) {
          <p class="mt-3 text-sm text-green-700">{{ 'admin.appearance.saved' | translate }}</p>
        }

        <form class="mt-5" [formGroup]="form" (ngSubmit)="save()">
          <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input type="checkbox" class="mt-0.5" formControlName="allowUserTemplate" />
            <span class="text-sm">
              <span class="font-semibold text-slate-900">{{ 'admin.appearance.allowUser' | translate }}</span>
              <span class="mt-1 block text-xs text-slate-500">
                {{ 'admin.appearance.allowUserHint' | translate }}
              </span>
            </span>
          </label>

          <div class="mt-5">
            <h3 class="text-sm font-semibold text-slate-900">{{ 'admin.appearance.defaultTemplate' | translate }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ 'admin.appearance.defaultTemplateHint' | translate }}</p>

            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              @for (tpl of templates; track tpl.id) {
                <button
                  type="button"
                  class="group relative overflow-hidden rounded-lg border-2 transition focus:outline-none focus:ring-2 focus:ring-[#d32f2f]/40"
                  [class.border-[#d32f2f]]="form.controls.defaultTemplate.value === tpl.id"
                  [class.shadow-md]="form.controls.defaultTemplate.value === tpl.id"
                  [class.border-slate-200]="form.controls.defaultTemplate.value !== tpl.id"
                  [class.hover:border-slate-400]="form.controls.defaultTemplate.value !== tpl.id"
                  [attr.aria-pressed]="form.controls.defaultTemplate.value === tpl.id"
                  (click)="selectTemplate(tpl.id)"
                >
                  <img
                    [src]="tpl.background"
                    [alt]="tpl.labelKey | translate"
                    class="block h-32 w-full object-cover"
                    loading="lazy"
                  />
                  <span class="block bg-white px-2 py-2 text-left text-sm font-medium text-slate-700">
                    {{ tpl.labelKey | translate }}
                  </span>
                  @if (form.controls.defaultTemplate.value === tpl.id) {
                    <span class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d32f2f] text-white shadow">
                      <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5">
                        <path d="M3 8.5l3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  }
                </button>
              }
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              class="inline-flex items-center justify-center rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b71c1c] disabled:opacity-60"
              type="submit"
              [disabled]="isSaving() || isLoading()"
            >
              {{ 'common.save' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AppearanceAdminPageComponent {
  readonly templates = CARD_TEMPLATES;
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup<AppearanceForm>({
    allowUserTemplate: new FormControl(false, { nonNullable: true }),
    defaultTemplate: new FormControl<TemplateId>('classic', { nonNullable: true })
  });

  constructor(private readonly admin: AdminService) {
    this.load();
  }

  selectTemplate(id: TemplateId) {
    this.form.controls.defaultTemplate.setValue(id);
  }

  load() {
    this.error.set(null);
    this.isLoading.set(true);

    this.admin
      .getAppearanceSettings()
      .pipe(
        catchError(() => {
          this.error.set('admin.appearance.errors.loadError');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((settings) => {
        if (!settings) return;
        this.form.patchValue({
          allowUserTemplate: settings.allowUserTemplate,
          defaultTemplate: settings.defaultTemplate
        });
      });
  }

  save() {
    this.success.set(false);
    this.error.set(null);

    const payload: AppearanceSettingsUpdatePayload = {
      allowUserTemplate: this.form.controls.allowUserTemplate.value,
      defaultTemplate: this.form.controls.defaultTemplate.value
    };

    this.isSaving.set(true);
    this.admin
      .updateAppearanceSettings(payload)
      .pipe(
        catchError((err: { error?: { error?: string } }) => {
          this.error.set(err?.error?.error ?? 'admin.appearance.errors.saveError');
          return of(null);
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe((res) => {
        if (!res) return;
        this.success.set(true);
        this.form.patchValue({
          allowUserTemplate: res.allowUserTemplate,
          defaultTemplate: res.defaultTemplate
        });
      });
  }
}
