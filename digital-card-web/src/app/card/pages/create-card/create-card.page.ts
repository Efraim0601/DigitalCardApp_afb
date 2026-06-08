import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { CardsService, PublicLabel } from '../../../shared/services/cards.service';
import { LanguageService } from '../../../shared/services/language.service';
import { ThemeService } from '../../../shared/services/theme.service';

type CreateCardForm = {
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  departmentId: FormControl<string>;
  jobTitleId: FormControl<string>;
  mobile: FormControl<string>;
};

@Component({
  selector: 'app-create-card-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-card.page.html'
})
export class CreateCardPageComponent {
  readonly isOptionsLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  /** Email of an already-existing card, surfaced so the user can jump to it. */
  readonly conflictEmail = signal<string | null>(null);

  readonly departments = signal<PublicLabel[]>([]);
  readonly jobTitles = signal<PublicLabel[]>([]);

  readonly form = new FormGroup<CreateCardForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    departmentId: new FormControl('', { nonNullable: true }),
    jobTitleId: new FormControl('', { nonNullable: true }),
    mobile: new FormControl('', { nonNullable: true })
  });

  constructor(
    private readonly cards: CardsService,
    private readonly router: Router,
    readonly lang: LanguageService,
    readonly theme: ThemeService
  ) {
    this.loadOptions();
  }

  labelOf(label: { labelFr?: string | null; labelEn?: string | null }): string {
    return this.lang.lang() === 'en'
      ? label.labelEn || label.labelFr || ''
      : label.labelFr || label.labelEn || '';
  }

  private loadOptions() {
    this.isOptionsLoading.set(true);
    forkJoin({
      departments: this.cards.listDepartments(),
      jobTitles: this.cards.listJobTitles()
    })
      .pipe(finalize(() => this.isOptionsLoading.set(false)))
      .subscribe({
        next: ({ departments, jobTitles }) => {
          this.departments.set(departments);
          this.jobTitles.set(jobTitles);
        },
        error: () => {
          this.departments.set([]);
          this.jobTitles.set([]);
        }
      });
  }

  private titleForJobTitle(jobTitleId: string): string | null {
    if (!jobTitleId) return null;
    const jt = this.jobTitles().find((item) => item.id === jobTitleId);
    return jt ? this.labelOf(jt) || null : null;
  }

  submit() {
    this.serverError.set(null);
    this.conflictEmail.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value.trim();
    const payload = {
      email,
      firstName: this.form.controls.firstName.value.trim() || null,
      lastName: this.form.controls.lastName.value.trim() || null,
      title: this.titleForJobTitle(this.form.controls.jobTitleId.value),
      mobile: this.form.controls.mobile.value.trim() || null,
      departmentId: this.form.controls.departmentId.value || null,
      jobTitleId: this.form.controls.jobTitleId.value || null
    };

    this.isSubmitting.set(true);
    this.cards
      .createPublicCard(payload)
      .pipe(
        tap((card) => {
          this.router.navigate(['/card'], {
            queryParams: { email: card.email, owner: '1' }
          });
        }),
        catchError((err: { status?: number }) => {
          if (err?.status === 409) {
            this.conflictEmail.set(email);
            this.serverError.set('create.errors.alreadyExists');
          } else {
            this.serverError.set('create.errors.generic');
          }
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe();
  }

  viewExistingCard() {
    const email = this.conflictEmail();
    if (email) {
      this.router.navigate(['/card'], { queryParams: { email } });
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
