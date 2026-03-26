import { Validators, AbstractControl, ValidationErrors } from '@angular/forms';

export const strongPasswordValidators = [
  Validators.required,
  Validators.minLength(8),
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\s]).*$/)
];

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

export function evaluatePasswordRules(value: string) {
  return {
    length:    value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number:    /[0-9]/.test(value),
    special:   /[^a-zA-Z0-9\s]/.test(value)
  };
}
