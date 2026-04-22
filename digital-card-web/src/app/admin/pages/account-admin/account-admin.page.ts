import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';

type AccountForm = {
  currentPassword: FormControl<string>;
  newEmail: FormControl<string>;
  newPassword: FormControl<string>;
};

@Component({
  selector: 'app-account-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="max-w-[520px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-[17px] font-semibold text-slate-900">{{ 'admin.account.title' | translate }}</h2>
      <p class="mt-2 text-sm leading-[1.55] text-slate-500">
        {{ 'admin.account.description' | translate }}
      </p>
      <p class="mt-1 text-xs text-slate-500">{{ 'admin.account.source' | translate }}</p>

      <form class="mt-5" [formGroup]="form" (ngSubmit)="submit()">
        <div class="mb-4">
          <label class="mb-1 block text-xs font-semibold text-slate-700">{{ 'admin.account.currentPassword' | translate }}</label>
          <input
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            type="password"
            autocomplete="current-password"
            formControlName="currentPassword"
          />
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-semibold text-slate-700">{{ 'admin.account.newEmail' | translate }}</label>
          <input
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            type="email"
            autocomplete="username"
            formControlName="newEmail"
          />
        </div>

        <div class="mb-3">
          <label class="mb-1 block text-xs font-semibold text-slate-700">{{ 'admin.account.newPassword' | translate }}</label>
          <input
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            type="password"
            autocomplete="new-password"
            formControlName="newPassword"
          />
        </div>

        @if (error()) {
          <p class="-mt-1 mb-3 text-sm text-[#d32f2f]">{{ error()! | translate }}</p>
        }
        @if (success()) {
          <p class="-mt-1 mb-3 text-sm text-green-700">{{ 'admin.account.success' | translate }}</p>
        }

        <button
          class="inline-flex items-center justify-center rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b71c1c] disabled:opacity-60"
          type="submit"
          [disabled]="isSaving()"
        >
          {{ 'admin.account.submit' | translate }}
        </button>
      </form>
    </div>
  `
})
export class AccountAdminPageComponent {
  readonly isSaving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup<AccountForm>({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newEmail: new FormControl('', { nonNullable: true }),
    newPassword: new FormControl('', { nonNullable: true })
  });

  constructor(private readonly auth: AuthService) {}

  submit() {
    this.success.set(false);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('admin.account.errors.currentPasswordRequired');
      return;
    }

    const newEmail = this.form.controls.newEmail.value.trim();
    const newPassword = this.form.controls.newPassword.value;

    if (!newEmail && !newPassword) {
      this.error.set('admin.account.errors.noChanges');
      return;
    }

    this.isSaving.set(true);
    this.auth
      .updateAdminCredentials({
        currentPassword: this.form.controls.currentPassword.value,
        newEmail: newEmail || null,
        newPassword: newPassword || null
      })
      .pipe(
        catchError(() => {
          this.error.set('admin.account.errors.saveError');
          return of(null);
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe(() => this.success.set(true));
  }
}
