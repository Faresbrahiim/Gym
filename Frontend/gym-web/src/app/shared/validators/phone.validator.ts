import { Validators } from '@angular/forms';

// Moroccan phone numbers: 06xxxxxxxx, 07xxxxxxxx, 05xxxxxxxx, +2126xxxxxxxx, etc.
export const moroccanPhoneValidators = [
  Validators.pattern(/^(\+212|0)(5|6|7)\d{8}$/)
];
