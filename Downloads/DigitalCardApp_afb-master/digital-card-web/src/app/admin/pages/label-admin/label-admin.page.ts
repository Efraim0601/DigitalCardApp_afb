import { Directive, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { AdminService, DataScope, Label, PagedResult } from '../../../shared/services/admin.service';

export type LabelForm = {
  labelFr: FormControl<string>;
  labelEn: FormControl<string>;
};

export type LabelAdminKeys = {
  loadErrorKey: string;
  saveErrorKey: string;
  deleteErrorKey: string;
  deleteConfirmKey: string;
  createTitleKey: string;
  editTitleKey: string;
};

@Directive()
export abstract class BaseLabelAdminPage {
  protected readonly translate = inject(TranslateService);

  readonly pageSize = 20;
  readonly q = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly maxPage = signal(1);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly items = signal<Label[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly isEditing = computed(() => this.editingId() !== null);
  readonly currentTitleKey = computed(() =>
    this.isEditing() ? this.keys().editTitleKey : this.keys().createTitleKey
  );

  readonly form = new FormGroup<LabelForm>({
    labelFr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    labelEn: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected abstract list(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>>;
  protected abstract create(payload: { labelFr: string; labelEn: string }): Observable<Label>;
  protected abstract updateItem(id: string, payload: { labelFr: string; labelEn: string }): Observable<Label>;
  protected abstract remove(id: string): Observable<void>;
  protected abstract keys(): LabelAdminKeys;
  protected abstract readonly exportScope: DataScope;
  protected abstract readonly adminService: AdminService;

  // ── CSV Import / Export ──────────────────────────────────────────────
  readonly isExporting = signal(false);
  readonly isImporting = signal(false);
  readonly importToast = signal<{ message: string; error: boolean } | null>(null);

  exportCsv(): void {
    this.isExporting.set(true);
    this.adminService.export(this.exportScope, 'csv').pipe(
      tap((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.exportScope === 'departments' ? 'directions.csv' : 'titres-postes.csv';
        a.click();
        URL.revokeObjectURL(url);
      }),
      catchError(() => {
        this.showImportToast(this.translate.instant('admin.csv.exportError'), true);
        return of(null);
      }),
      finalize(() => this.isExporting.set(false))
    ).subscribe();
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = ''; // reset for re-import

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showImportToast(this.translate.instant('admin.csv.notCsv'), true);
      return;
    }

    this.isImporting.set(true);
    this.adminService.import(this.exportScope, file, 'overwrite').pipe(
      tap((result) => {
        const count = this.exportScope === 'departments'
          ? result.imported.departments
          : result.imported.jobTitles;
        this.showImportToast(
          this.translate.instant('admin.csv.importSuccess', { count }),
          false
        );
        this.page.set(1);
        this.load();
      }),
      catchError((err) => {
        const reason = err?.error?.message || err?.error?.error || '';
        this.showImportToast(
          reason
            ? this.translate.instant('admin.csv.importErrorReason', { reason })
            : this.translate.instant('admin.csv.importError'),
          true
        );
        return of(null);
      }),
      finalize(() => this.isImporting.set(false))
    ).subscribe();
  }

  dismissImportToast(): void {
    this.importToast.set(null);
  }

  private showImportToast(message: string, error: boolean): void {
    this.importToast.set({ message, error });
    setTimeout(() => this.importToast.set(null), 6000);
  }

  load(): void {
    this.error.set(null);
    this.isLoading.set(true);
    this.list({ q: this.q() || undefined, limit: this.pageSize, offset: (this.page() - 1) * this.pageSize })
      .pipe(
        tap((res) => {
          this.items.set(res.items ?? []);
          this.total.set(res.total ?? 0);
          this.maxPage.set(Math.max(1, Math.ceil((res.total ?? 0) / this.pageSize)));
        }),
        catchError(() => {
          this.error.set(this.keys().loadErrorKey);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  onSearch(v: string): void {
    this.q.set(v);
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.maxPage()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  openForm(): void {
    this.editingId.set(null);
    this.form.reset({ labelFr: '', labelEn: '' });
    this.error.set(null);
    this.showForm.set(true);
  }

  startEdit(item: Label): void {
    this.editingId.set(item.id);
    this.form.reset({ labelFr: item.labelFr ?? '', labelEn: item.labelEn ?? '' });
    this.error.set(null);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset({ labelFr: '', labelEn: '' });
  }

  save(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      labelFr: this.form.controls.labelFr.value.trim(),
      labelEn: this.form.controls.labelEn.value.trim()
    };
    const editingId = this.editingId();
    const request$ = editingId ? this.updateItem(editingId, payload) : this.create(payload);

    this.isLoading.set(true);
    request$
      .pipe(
        tap(() => {
          this.cancelForm();
          if (!editingId) this.page.set(1);
          this.load();
        }),
        catchError(() => {
          this.error.set(this.keys().saveErrorKey);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  deleteOne(id: string): void {
    if (!confirm(this.translate.instant(this.keys().deleteConfirmKey))) return;
    this.isLoading.set(true);
    this.remove(id)
      .pipe(
        tap(() => this.load()),
        catchError(() => {
          this.error.set(this.keys().deleteErrorKey);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
}
