import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Form-level validator for the payment form:
 *  paying by card needs the last 4 digits of the card (same rule as the API). */
export function cardNeedsLast4(group: AbstractControl): ValidationErrors | null {
  const method = group.get('method')?.value;
  const last4 = String(group.get('card_last4')?.value ?? '');
  return method === 'card' && !/^\d{4}$/.test(last4) ? { last4: true } : null;
}
