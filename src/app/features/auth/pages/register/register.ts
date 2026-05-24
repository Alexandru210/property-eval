import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatchValidator },
  );

  protected async submit(): Promise<void> {
    this.submitError.set(null);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();
    this.isSubmitting.set(true);

    try {
      await this.authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.submitError.set(this.getSubmitErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected hasError(controlName: 'name' | 'email' | 'password' | 'confirmPassword', errorName: string): boolean {
    const control = this.registerForm.controls[controlName];
    return control.hasError(errorName) && (control.dirty || control.touched);
  }

  protected showPasswordMismatch(): boolean {
    const confirmPassword = this.registerForm.controls.confirmPassword;
    return this.registerForm.hasError('passwordMismatch') && (confirmPassword.dirty || confirmPassword.touched);
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword || password === confirmPassword) {
      return null;
    }

    return { passwordMismatch: true };
  }

  private getSubmitErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendMessage(error);

      if (backendMessage) {
        return backendMessage;
      }

      if (error.status === 0) {
        return 'Could not reach the server. Please check that the API is running and try again.';
      }

      if (error.status === 409) {
        return 'An account with this email already exists.';
      }
    }

    return 'Registration failed. Please check your details and try again.';
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return null;
  }
}
