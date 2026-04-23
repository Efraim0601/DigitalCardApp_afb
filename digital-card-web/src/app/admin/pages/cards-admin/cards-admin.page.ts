import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { Card } from '../../../shared/models/card.model';
import { AdminService, Label } from '../../../shared/services/admin.service';
import { LanguageService } from '../../../shared/services/language.service';

type CardForm = {
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  departmentId: FormControl<string>;
  jobTitleId: FormControl<string>;
  mobile: FormControl<string>;
};

@Component({
  selector: 'app-cards-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './cards-admin.page.html'
})
export class CardsAdminPageComponent {
  readonly pageSize = 20;

  readonly q = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly maxPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly isLoading = signal(false);
  readonly isOptionsLoading = signal(false);
  readonly isTransferring = signal(false);
  readonly error = signal<string | null>(null);
  readonly transferMessage = signal<string | null>(null);
  readonly transferWarnings = signal<string[]>([]);

  readonly cards = signal<Card[]>([]);
  readonly departments = signal<Label[]>([]);
  readonly jobTitles = signal<Label[]>([]);
  readonly selected = signal<Record<string, boolean>>({});

  @ViewChild('importFileInput') importFileInput?: ElementRef<HTMLInputElement>;

  readonly selectedCount = computed(() => Object.values(this.selected()).filter(Boolean).length);

  readonly isEditing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formTitle = computed(() =>
    this.isEditing() ? 'admin.cards.formTitleEdit' : 'admin.cards.formTitleCreate'
  );

  readonly form = new FormGroup<CardForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    departmentId: new FormControl('', { nonNullable: true }),
    jobTitleId: new FormControl('', { nonNullable: true }),
    mobile: new FormControl('', { nonNullable: true })
  });

  constructor(
    private readonly admin: AdminService,
    private readonly translate: TranslateService,
    private readonly language: LanguageService
  ) {
    this.loadReferenceData();
    this.load();
  }

  departmentLabel(dep: { labelFr?: string | null; labelEn?: string | null } | null | undefined): string {
    if (!dep) return '';
    return this.language.lang() === 'en'
      ? dep.labelEn || dep.labelFr || ''
      : dep.labelFr || dep.labelEn || '';
  }

  jobTitleLabel(job: { labelFr?: string | null; labelEn?: string | null } | null | undefined): string {
    if (!job) return '';
    return this.language.lang() === 'en'
      ? job.labelEn || job.labelFr || ''
      : job.labelFr || job.labelEn || '';
  }

  loadReferenceData() {
    this.isOptionsLoading.set(true);
    forkJoin({
      departments: this.admin.listDepartments({ limit: 200, offset: 0 }),
      jobTitles: this.admin.listJobTitles({ limit: 200, offset: 0 })
    })
      .pipe(finalize(() => this.isOptionsLoading.set(false)))
      .subscribe({
        next: ({ departments, jobTitles }) => {
          this.departments.set(departments.items ?? []);
          this.jobTitles.set(jobTitles.items ?? []);
        },
        error: () => {
          this.departments.set([]);
          this.jobTitles.set([]);
        }
      });
  }

  load() {
    this.error.set(null);
    this.isLoading.set(true);
    this.admin
      .listCards({
        q: this.q() || undefined,
        limit: this.pageSize,
        offset: (this.page() - 1) * this.pageSize
      })
      .pipe(
        tap((res) => {
          this.cards.set(res.items ?? []);
          this.total.set(res.total ?? 0);
          this.selected.set({});
        }),
        catchError(() => {
          this.error.set('admin.cards.errors.loadError');
          this.cards.set([]);
          this.total.set(0);
          this.selected.set({});
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
    this.page.set(this.page() - 1);
    this.load();
  }

  nextPage() {
    const maxPage = Math.max(1, Math.ceil(this.total() / this.pageSize));
    if (this.page() >= maxPage) return;
    this.page.set(this.page() + 1);
    this.load();
  }

  toggleSelectAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    for (const c of this.cards()) {
      if (c.id) next[c.id] = checked;
    }
    this.selected.set(next);
  }

  toggleOne(id: string, checked: boolean) {
    this.selected.set({ ...this.selected(), [id]: checked });
  }

  startCreate() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.loadReferenceData();
    this.form.reset({
      email: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      jobTitleId: '',
      mobile: ''
    });
  }

  startEdit(card: Card) {
    this.isEditing.set(true);
    this.editingId.set(card.id ?? null);
    this.loadReferenceData();
    this.form.reset({
      email: card.email ?? '',
      firstName: card.firstName ?? '',
      lastName: card.lastName ?? '',
      departmentId: card.department?.id ?? '',
      jobTitleId: card.jobTitle?.id ?? '',
      mobile: card.mobile ?? ''
    });
    document.getElementById('edit-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.reset({
      email: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      jobTitleId: '',
      mobile: ''
    });
  }

  save() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      email: this.form.controls.email.value.trim(),
      firstName: this.form.controls.firstName.value.trim() || null,
      lastName: this.form.controls.lastName.value.trim() || null,
      title: this.labelForJobTitle(this.form.controls.jobTitleId.value) || null,
      mobile: this.form.controls.mobile.value.trim() || null,
      departmentId: this.form.controls.departmentId.value || null,
      jobTitleId: this.form.controls.jobTitleId.value || null
    };

    const editingId = this.editingId();
    const request$ = editingId
      ? this.admin.updateCard(editingId, payload)
      : this.admin.createOrUpsertCard(payload);

    this.isLoading.set(true);
    request$
      .pipe(
        tap(() => this.cancelEdit()),
        tap(() => this.load()),
        catchError(() => {
          this.error.set('admin.cards.errors.saveError');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  labelForJobTitle(jobTitleId: string): string {
    if (!jobTitleId) return '';
    const label = this.jobTitles().find((item) => item.id === jobTitleId);
    return label?.labelFr || label?.labelEn || '';
  }

  bulkDelete() {
    const ids = Object.entries(this.selected())
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) return;
    if (!confirm(this.translate.instant('admin.cards.confirmBulkDelete', { count: ids.length }))) return;

    this.isLoading.set(true);
    this.admin
      .bulkDeleteCards(ids)
      .pipe(
        tap(() => this.load()),
        catchError(() => {
          this.error.set('admin.cards.errors.deleteError');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  deleteOne(id: string) {
    if (!confirm(this.translate.instant('admin.cards.confirmDeleteOne'))) return;
    this.isLoading.set(true);
    this.admin
      .deleteCard(id)
      .pipe(
        tap(() => this.load()),
        catchError(() => {
          this.error.set('admin.cards.errors.deleteError');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  downloadTemplate() {
    this.clearTransferState();
    this.isTransferring.set(true);
    this.admin
      .downloadTemplate('cards')
      .pipe(
        tap((blob) => this.saveBlob(blob, 'modele-cartes.xlsx')),
        catchError(() => {
          this.error.set('admin.cards.errors.templateError');
          return of(null);
        }),
        finalize(() => this.isTransferring.set(false))
      )
      .subscribe();
  }

  exportCards(format: 'csv' | 'xlsx') {
    this.clearTransferState();
    this.isTransferring.set(true);
    const filename = format === 'xlsx' ? 'cartes.xlsx' : 'cartes.csv';
    this.admin
      .export('cards', format)
      .pipe(
        tap((blob) => this.saveBlob(blob, filename)),
        catchError(() => {
          this.error.set('admin.cards.errors.exportError');
          return of(null);
        }),
        finalize(() => this.isTransferring.set(false))
      )
      .subscribe();
  }

  triggerImport() {
    this.importFileInput?.nativeElement.click();
  }

  onImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.clearTransferState();
    this.isTransferring.set(true);
    this.admin
      .import('cards', file)
      .pipe(
        tap((res) => {
          const imported = res?.imported?.cards ?? 0;
          this.transferMessage.set(
            this.translate.instant('admin.cards.transfer.importSuccess', { count: imported })
          );
          this.transferWarnings.set(res?.warnings ?? []);
          this.load();
        }),
        catchError((err) => {
          const msg = err?.error?.message || err?.message || '';
          this.error.set(msg
            ? this.translate.instant('admin.cards.errors.importErrorWithReason', { reason: msg })
            : 'admin.cards.errors.importError');
          return of(null);
        }),
        finalize(() => this.isTransferring.set(false))
      )
      .subscribe();
  }

  dismissTransfer() {
    this.clearTransferState();
  }

  private clearTransferState() {
    this.error.set(null);
    this.transferMessage.set(null);
    this.transferWarnings.set([]);
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
