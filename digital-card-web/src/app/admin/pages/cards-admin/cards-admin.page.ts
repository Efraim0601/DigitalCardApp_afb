import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';
import { Card } from '../../../shared/models/card.model';
import { AdminService } from '../../../shared/services/admin.service';

type CardForm = {
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  title: FormControl<string>;
  mobile: FormControl<string>;
};

@Component({
  selector: 'app-cards-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cards-admin.page.html'
})
export class CardsAdminPageComponent {
  readonly pageSize = 20;

  readonly q = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly maxPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly cards = signal<Card[]>([]);
  readonly selected = signal<Record<string, boolean>>({});

  readonly selectedCount = computed(() => Object.values(this.selected()).filter(Boolean).length);

  readonly pageLabel = computed(() => {
    return `${this.page()} / ${this.maxPage()}`;
  });

  readonly resultCountLabel = computed(() => `${this.total()} résultat(s)`);

  readonly isEditing = signal(false);
  readonly formTitle = computed(() => (this.isEditing() ? 'Modifier une carte' : 'Créer une carte'));

  readonly form = new FormGroup<CardForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    title: new FormControl('', { nonNullable: true }),
    mobile: new FormControl('', { nonNullable: true })
  });

  constructor(private readonly admin: AdminService) {
    this.load();
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
          this.error.set('Impossible de charger les cartes.');
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
    this.form.reset({
      email: '',
      firstName: '',
      lastName: '',
      title: '',
      mobile: ''
    });
  }

  startEdit(card: Card) {
    this.isEditing.set(true);
    this.form.reset({
      email: card.email ?? '',
      firstName: card.firstName ?? '',
      lastName: card.lastName ?? '',
      title: card.title ?? '',
      mobile: card.mobile ?? ''
    });
    document.getElementById('edit-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.form.reset({
      email: '',
      firstName: '',
      lastName: '',
      title: '',
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
      title: this.form.controls.title.value.trim() || null,
      mobile: this.form.controls.mobile.value.trim() || null
    };

    this.isLoading.set(true);
    this.admin
      .createOrUpsertCard(payload)
      .pipe(
        tap(() => this.cancelEdit()),
        tap(() => this.load()),
        catchError(() => {
          this.error.set("Impossible d'enregistrer.");
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  bulkDelete() {
    const ids = Object.entries(this.selected())
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) return;
    if (!confirm(`Supprimer ${ids.length} carte(s) ?`)) return;

    this.isLoading.set(true);
    this.admin
      .bulkDeleteCards(ids)
      .pipe(
        tap(() => this.load()),
        catchError(() => {
          this.error.set('Impossible de supprimer.');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  deleteOne(id: string) {
    if (!confirm('Supprimer cette carte ?')) return;
    this.isLoading.set(true);
    this.admin
      .bulkDeleteCards([id])
      .pipe(
        tap(() => this.load()),
        catchError(() => {
          this.error.set('Impossible de supprimer.');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
}

