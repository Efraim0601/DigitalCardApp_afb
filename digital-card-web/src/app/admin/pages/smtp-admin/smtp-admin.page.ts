import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { AdminService, SmtpSettingsUpdatePayload } from '../../../shared/services/admin.service';

type SmtpForm = {
  enabled: FormControl<boolean>;
  host: FormControl<string>;
  port: FormControl<number>;
  username: FormControl<string>;
  password: FormControl<string>;
  clearPassword: FormControl<boolean>;
  protocol: FormControl<string>;
  auth: FormControl<boolean>;
  starttlsEnabled: FormControl<boolean>;
  sslEnabled: FormControl<boolean>;
  fromEmail: FormControl<string>;
  fromName: FormControl<string>;
  testToEmail: FormControl<string>;
};

@Component({
  selector: 'app-smtp-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-5">
      <div class="max-w-[900px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-[17px] font-semibold text-slate-900">Configuration SMTP et notifications employé</h2>
        <p class="mt-2 text-sm leading-[1.55] text-slate-500">
          Lorsqu'activé, un email est envoyé automatiquement à l'employé après création ou mise à jour de sa carte.
        </p>

        @if (error()) {
          <p class="mt-3 text-sm text-[#d32f2f]">{{ error() }}</p>
        }
        @if (success()) {
          <p class="mt-3 text-sm text-green-700">Configuration SMTP enregistrée.</p>
        }
        @if (testSuccess()) {
          <p class="mt-2 text-sm text-green-700">Email de test envoyé.</p>
        }

        <form class="mt-5" [formGroup]="form" (ngSubmit)="save()">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" formControlName="enabled" />
              Activer les notifications email automatiques
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" formControlName="auth" />
              SMTP Auth
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" formControlName="starttlsEnabled" />
              STARTTLS
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" formControlName="sslEnabled" />
              SSL/TLS
            </label>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Hôte SMTP</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" formControlName="host" placeholder="smtp.office365.com" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Port</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" type="number" formControlName="port" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Protocole</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" formControlName="protocol" placeholder="smtp" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Username SMTP</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" formControlName="username" placeholder="no-reply@afriland..." />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Mot de passe SMTP</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" type="password" formControlName="password" placeholder="Laisser vide pour conserver" />
            </div>
            <div class="pt-6">
              <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" formControlName="clearPassword" />
                Effacer le mot de passe stocké
              </label>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Email expéditeur</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" type="email" formControlName="fromEmail" placeholder="no-reply@afriland..." />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Nom expéditeur</label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" formControlName="fromName" placeholder="Cardyo RH" />
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              class="inline-flex items-center justify-center rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b71c1c] disabled:opacity-60"
              type="submit"
              [disabled]="isSaving() || isLoading()"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <div class="max-w-[900px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-[15px] font-semibold text-slate-900">Test d'envoi SMTP</h3>
        <p class="mt-1 text-sm text-slate-500">Envoie un email de test avec la configuration courante.</p>

        <div class="mt-4 flex flex-wrap items-end gap-3">
          <div class="w-full sm:max-w-[420px]">
            <label class="mb-1 block text-xs font-semibold text-slate-700">Email destinataire du test</label>
            <input
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              type="email"
              formControlName="testToEmail"
              [formControl]="form.controls.testToEmail"
              placeholder="votre.email@afriland..."
            />
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-[#d32f2f] bg-white px-4 py-2 text-sm font-semibold text-[#d32f2f] transition hover:bg-[#fff5f5] disabled:opacity-60"
            [disabled]="isTesting() || isLoading()"
            (click)="sendTest()"
          >
            Envoyer un test
          </button>
        </div>
      </div>
    </div>
  `
})
export class SmtpAdminPageComponent {
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isTesting = signal(false);
  readonly success = signal(false);
  readonly testSuccess = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup<SmtpForm>({
    enabled: new FormControl(false, { nonNullable: true }),
    host: new FormControl('', { nonNullable: true }),
    port: new FormControl(587, { nonNullable: true, validators: [Validators.min(1), Validators.max(65535)] }),
    username: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    clearPassword: new FormControl(false, { nonNullable: true }),
    protocol: new FormControl('smtp', { nonNullable: true }),
    auth: new FormControl(true, { nonNullable: true }),
    starttlsEnabled: new FormControl(true, { nonNullable: true }),
    sslEnabled: new FormControl(false, { nonNullable: true }),
    fromEmail: new FormControl('', { nonNullable: true }),
    fromName: new FormControl('Digital Card', { nonNullable: true }),
    testToEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  constructor(private readonly admin: AdminService) {
    this.load();
  }

  load() {
    this.error.set(null);
    this.isLoading.set(true);

    this.admin
      .getSmtpSettings()
      .pipe(
        catchError(() => {
          this.error.set('Impossible de charger la configuration SMTP.');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((settings) => {
        if (!settings) return;

        this.form.patchValue({
          enabled: settings.enabled,
          host: settings.host ?? '',
          port: settings.port ?? 587,
          username: settings.username ?? '',
          password: '',
          clearPassword: false,
          protocol: settings.protocol || 'smtp',
          auth: settings.auth,
          starttlsEnabled: settings.starttlsEnabled,
          sslEnabled: settings.sslEnabled,
          fromEmail: settings.fromEmail ?? '',
          fromName: settings.fromName ?? 'Digital Card',
          testToEmail: settings.fromEmail ?? ''
        });
      });
  }

  save() {
    this.success.set(false);
    this.testSuccess.set(false);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Veuillez corriger les champs invalides.');
      return;
    }

    const payload: SmtpSettingsUpdatePayload = {
      enabled: this.form.controls.enabled.value,
      host: this.form.controls.host.value.trim(),
      port: this.form.controls.port.value,
      username: this.form.controls.username.value.trim(),
      protocol: this.form.controls.protocol.value.trim() || 'smtp',
      auth: this.form.controls.auth.value,
      starttlsEnabled: this.form.controls.starttlsEnabled.value,
      sslEnabled: this.form.controls.sslEnabled.value,
      fromEmail: this.form.controls.fromEmail.value.trim(),
      fromName: this.form.controls.fromName.value.trim(),
      clearPassword: this.form.controls.clearPassword.value
    };

    const password = this.form.controls.password.value;
    if (password && password.trim()) {
      payload.password = password;
    }

    this.isSaving.set(true);
    this.admin
      .updateSmtpSettings(payload)
      .pipe(
        catchError((err: { error?: { error?: string } }) => {
          this.error.set(err?.error?.error ?? "Impossible d'enregistrer la configuration SMTP.");
          return of(null);
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe((res) => {
        if (!res) return;
        this.success.set(true);
        this.form.controls.password.setValue('');
        this.form.controls.clearPassword.setValue(false);
      });
  }

  sendTest() {
    this.success.set(false);
    this.testSuccess.set(false);
    this.error.set(null);

    const toEmail = this.form.controls.testToEmail.value.trim();
    if (!toEmail) {
      this.error.set("Veuillez saisir l'email destinataire du test.");
      return;
    }

    this.isTesting.set(true);
    this.admin
      .sendSmtpTestEmail(toEmail)
      .pipe(
        catchError((err: { error?: { error?: string } }) => {
          this.error.set(err?.error?.error ?? "Impossible d'envoyer l'email de test.");
          return of(null);
        }),
        finalize(() => this.isTesting.set(false))
      )
      .subscribe((res) => {
        if (!res) return;
        this.testSuccess.set(true);
      });
  }
}
