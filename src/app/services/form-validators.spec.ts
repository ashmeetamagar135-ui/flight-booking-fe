import { FormControl, FormGroup } from '@angular/forms';
import { cardNeedsLast4 } from './form-validators';

function group(method: string, last4: string): FormGroup {
  return new FormGroup({ method: new FormControl(method), card_last4: new FormControl(last4) });
}

describe('cardNeedsLast4 validator', () => {
  it('rejects a card payment with no digits', () => {
    expect(cardNeedsLast4(group('card', ''))).toEqual({ last4: true });
  });

  it('rejects letters and the wrong length', () => {
    expect(cardNeedsLast4(group('card', 'abcd'))).toEqual({ last4: true });
    expect(cardNeedsLast4(group('card', '123'))).toEqual({ last4: true });
    expect(cardNeedsLast4(group('card', '12345'))).toEqual({ last4: true });
  });

  it('accepts exactly 4 digits', () => {
    expect(cardNeedsLast4(group('card', '4242'))).toBeNull();
  });

  it('does not ask for digits when paying with PayPal', () => {
    expect(cardNeedsLast4(group('paypal', ''))).toBeNull();
  });
});
