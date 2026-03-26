import { Validators } from '@angular/forms';

export const emailValidators = [
  Validators.required,
  Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
];
