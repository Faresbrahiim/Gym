import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const MIN_AGE = 13;
const MAX_AGE = 120;

export function dateOfBirthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const inputDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(inputDate.getTime())) return { invalidDate: true };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate > today) return { futureDateOfBirth: true };

    const minBirth = new Date(today);
    minBirth.setFullYear(today.getFullYear() - MIN_AGE);
    if (inputDate > minBirth) return { tooYoung: true };

    const maxBirth = new Date(today);
    maxBirth.setFullYear(today.getFullYear() - MAX_AGE);
    if (inputDate < maxBirth) return { tooOld: true };

    return null;
  };
}

export function maxDateInputValue(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return toLocalDateInputValue(d);
}

export function minDateInputValue(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE);
  return toLocalDateInputValue(d);
}

export function normalizeDateInputValue(value: string | null | undefined): string {
  if (!value) return '';

  const normalized = value.slice(0, 10);
  const inputDate = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(inputDate.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minBirth = new Date(today);
  minBirth.setFullYear(today.getFullYear() - MIN_AGE);

  const maxBirth = new Date(today);
  maxBirth.setFullYear(today.getFullYear() - MAX_AGE);

  if (inputDate > today || inputDate > minBirth || inputDate < maxBirth) return '';

  return normalized;
}

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
