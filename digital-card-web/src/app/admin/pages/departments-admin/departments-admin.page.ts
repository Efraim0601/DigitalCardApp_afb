import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';
import { AdminService, Label } from '../../../shared/services/admin.service';

type LabelForm = {
  labelFr: FormControl<string>;
  labelEn: FormControl<string>;
};

@Component({
  selector: 'app-departments-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-5">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-[#d32f2f] bg-white px-3 py-1.5 text-xs font-semibold text-[#d32f2f] transition hover:bg-[#fff5f5]"
            (click)="openForm()"
          >
            Ajouter une direction
          </button>
        </div>
        <input
          class="w-full max-w-[320px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
          placeholder="Rechercher…"
          [value]="q()"
          (input)="onSearch($any($event.target).value)"
        />
      </div>

      <!-- Form panel -->
      @if (showForm()) {
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="text-[17px] font-semibold text-slate-900">Ajouter une direction</div>
          @if (error()) {
            <p class="mt-2 text-sm text-[#d32f2f]">{{ error() }}</p>
          }
          <form class="mt-4" [formGroup]="form" (ngSubmit)="save()">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-700">Libellé (français) <span class="text-[#d32f2f]">*</span></label>
                <input
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  formControlName="labelFr"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-700">Libellé (anglais) <span class="text-[#d32f2f]">*</span></label>
                <input
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  formControlName="labelEn"
                />
              </div>
            </div>
            <div class="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <button
                class="inline-flex items-center justify-center rounded-lg bg-[#d32f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b71c1c] disabled:opacity-60"
                type="submit"
                [disabled]="isLoading()"
              >
                Enregistrer
              </button>
              <button
                class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                type="button"
                (click)="cancelForm()"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-[600px] w-full border-collapse">
            <thead class="bg-slate-50">
              <tr>
                <th class="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600">Libellé (français)</th>
                <th class="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-600">Libellé (anglais)</th>
                <th class="border-b border-slate-200 px-4 py-2 text-right text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                <tr>
                  <td colspan="3" class="px-4 py-6 text-center text-sm text-slate-500">Chargement…</td>
                </tr>
              } @else if (items().length === 0) {
                <tr>
                  <td colspan="3" class="px-4 py-6 text-center text-sm text-slate-400">Aucune direction enregistrée.</td>
                </tr>
              } @else {
                @for (item of items(); track item.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="border-b border-slate-100 px-4 py-2 text-sm text-slate-700">{{ item.labelFr }}</td>
                    <td class="border-b border-slate-100 px-4 py-2 text-sm text-slate-700">{{ item.labelEn }}</td>
                    <td class="border-b border-slate-100 px-4 py-2 text-right text-sm">
                      <button
                        type="button"
                        class="text-slate-500 hover:text-[#d32f2f]"
                        (click)="deleteOne(item.id)"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-slate-200 px-4 py-2">
          <span class="text-xs text-slate-500">{{ total() }} résultat(s)</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              (click)="prevPage()"
              [disabled]="page() <= 1"
            >
              ← Préc.
            </button>
            <span class="flex items-center px-2 text-xs text-slate-600">{{ page() }} / {{ maxPage() }}</span>
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              (click)="nextPage()"
              [disabled]="page() >= maxPage()"
            >
              Suiv. →
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DepartmentsAdminPageComponent {
  readonly pageSize = 20;
  readonly q = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly maxPage = signal(1);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly items = signal<Label[]>([]);

  readonly form = new FormGroup<LabelForm>({
    labelFr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    labelEn: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(private readonly admin: AdminService) {
    this.load();
  }

  load() {
    this.error.set(null);
    this.isLoading.set(true);
    this.admin
      .listDepartments({ q: this.q() || undefined, limit: this.pageSize, offset: (this.page() - 1) * this.pageSize })
      .pipe(
        tap((res) => {
          this.items.set(res.items ?? []);
          this.total.set(res.total ?? 0);
          this.maxPage.set(Math.max(1, Math.ceil((res.total ?? 0) / this.pageSize)));
        }),
        catchError(() => {
          this.error.set('Impossible de charger les directions.');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  onSearch(v: string) {
    this.q.set(v);
    this.page.set(1);
    this.load();
  }

  prevPage() {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage() {
    if (this.page() >= this.maxPage()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  openForm() {
    this.form.reset({ labelFr: '', labelEn: '' });
    this.error.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.form.reset({ labelFr: '', labelEn: '' });
  }

  save() {
    this.error.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.admin
      .createDepartment({ labelFr: this.form.controls.labelFr.value.trim(), labelEn: this.form.controls.labelEn.value.trim() })
      .pipe(
        tap(() => { this.cancelForm(); this.page.set(1); this.load(); }),
        catchError(() => { this.error.set("Impossible d'enregistrer."); return of(null); }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  deleteOne(id: string) {
    if (!confirm('Supprimer cette direction ?')) return;
    this.isLoading.set(true);
    this.admin
      .deleteDepartment(id)
      .pipe(
        tap(() => this.load()),
        catchError(() => { this.error.set('Impossible de supprimer.'); return of(null); }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
}

