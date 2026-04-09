import { Component, Input } from '@angular/core';
import { evaluatePasswordRules } from '../../validators/password.validator';

@Component({
  standalone: true,
  selector: 'app-password-rules',
  templateUrl: './password-rules.component.html',
  styleUrl: './password-rules.component.css'
})
export class PasswordRulesComponent {
  @Input() password = '';
  @Input() touched = false;

  get rules() { return evaluatePasswordRules(this.password); }

  get allSatisfied(): boolean {
    const r = this.rules;
    return r.length && r.uppercase && r.lowercase && r.number && r.special;
  }
}
