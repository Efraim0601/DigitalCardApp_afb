import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-[520px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-[17px] font-semibold text-slate-900">Identifiants de connexion administrateur</h2>
      <p class="mt-2 text-sm leading-[1.55] text-slate-500">
        Après enregistrement, les identifiants sont stockés en base et remplacent les variables d'environnement pour la connexion.
      </p>
      <p class="mt-1 text-xs text-slate-500">Source : configuration (variables d'environnement)</p>

      <form class="mt-5" [formGroup]="form" (ngSubmit)="submit()">
        <div class="mb-4">
          <label class="mb-1 block text-xs font-semibold text-slate-700">Mot de passe actuel</label>
          <input
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            type="password"
            autocomplete="current-password"
            formControlName="currentPassword"
          />
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-semibold text-slate-700">Nouvel email (optionnel)</label>
          <input
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            type="email"
            autocomplete="username"
            formControlName="newEmail"
          />
        </div>

        <div class="mb-3">
          <label class="mb-1 block text-xs font-semibold text-slate-700">Nouveau mot de passe (optionnel)</label>
          <input
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            type="password"
            autocomplete="new-password"
            formControlName="newPassword"
          />
        </div>

        @if (error()) {
          <p class="-mt-1 mb-3 text-sm text-[#d32f2f]">{{ error() }}</p>
        }
        @if (success()) {
          <p class="-mt-1 mb-3 text-sm text-green-700">Identifiants mis à jour avec succès.</p>
        }

        <button
          class="inline-flex items-center justify-center rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b71c1c] disabled:opacity-60"
          type="submit"
          [disabled]="isSaving()"
        >
          Mettre à jour les identifiants
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
      this.error.set('Le mot de passe actuel est requis.');
      return;
    }

    const newEmail = this.form.controls.newEmail.value.trim();
    const newPassword = this.form.controls.newPassword.value;

    if (!newEmail && !newPassword) {
      this.error.set('Aucune modification à enregistrer.');
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
          this.error.set("Impossible d'enregistrer.");
          return of(null);
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe(() => this.success.set(true));
  }
}

