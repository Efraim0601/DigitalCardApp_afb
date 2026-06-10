import { Directive, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { Label, PagedResult } from '../../../shared/services/admin.service';

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
