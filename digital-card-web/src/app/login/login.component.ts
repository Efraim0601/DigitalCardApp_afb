import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { AuthService, LoginHintResponse } from '../shared/services/auth.service';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  readonly isSubmitting = signal(false);
  readonly isHintLoading = signal(false);
  readonly hint = signal<LoginHintResponse | null>(null);
  readonly serverError = signal<string | null>(null);

  readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true })
  });

  readonly isAdmin = computed(() => this.hint()?.isAdminEmail === true);
  readonly hasCard = computed(() => this.hint()?.hasCard === true);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    effect(() => {
      // If email changed and we are not admin anymore, clear password.
      if (!this.isAdmin()) {
        this.form.controls.password.setValue('');
        this.form.controls.password.setErrors(null);
      }
    });
  }

  onEmailBlur() {
    this.serverError.set(null);
    this.hint.set(null);

    const email = this.form.controls.email.value.trim();
    if (!email || this.form.controls.email.invalid) return;

    this.isHintLoading.set(true);
    this.auth
      .loginHint(email)
      .pipe(
        tap((hint) => this.hint.set(hint)),
        switchMap((hint) => {
          if (hint.hasCard && !hint.isAdminEmail) {
            return this.router.navigate(['/card'], { queryParams: { email } }).then(() => of(null));
          }
          return of(null);
        }),
        catchError(() => {
          this.serverError.set('login.errors.generic');
          return of(null);
        }),
        finalize(() => this.isHintLoading.set(false))
      )
      .subscribe();
  }

  submit() {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value.trim();
    if (!email) return;

    if (this.isAdmin()) {
      const password = this.form.controls.password.value;
      if (!password) {
        this.form.controls.password.setErrors({ required: true });
        this.form.controls.password.markAsTouched();
        return;
      }

      this.isSubmitting.set(true);
      this.auth
        .adminLogin({ email, password })
        .pipe(
          tap(() => this.router.navigate(['/admin/cards'])),
          catchError(() => {
            this.serverError.set('login.errors.generic');
            return of(null);
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe();

      return;
    }

    // Non-admin flow: needs a card.
    if (this.hasCard()) {
      this.router.navigate(['/card'], { queryParams: { email } });
    } else {
      this.serverError.set('login.errors.noCard');
    }
  }
}

