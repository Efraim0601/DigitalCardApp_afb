import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './login.page.html'
})
export class LoginPageComponent {
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true })
  });

  readonly isAdmin = computed(() => this.form.controls.email.value.toLowerCase().includes('admin'));

  constructor(private readonly router: Router) {}

  onEmailBlur() {
    this.serverError.set(null);
    if (!this.isAdmin()) {
      this.form.controls.password.setValue('');
    }
  }

  async submit() {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isAdmin() && !this.form.controls.password.value) {
      this.form.controls.password.setErrors({ required: true });
      this.form.controls.password.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      // TODO: AuthService login (cookie/JWT). For now just route to card demo.
      await this.router.navigate(['/card/demo'], {
        queryParams: { email: this.form.controls.email.value }
      });
    } catch {
      this.serverError.set('login.errors.generic');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

