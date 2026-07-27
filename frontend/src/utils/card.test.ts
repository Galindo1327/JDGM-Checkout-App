import { describe, expect, it } from 'vitest';
import {
  detectCardBrand,
  formatCardNumber,
  getCardBrandLogo,
  isValidCardNumber,
  onlyDigits,
} from './card';

describe('card utils', () => {
  it('keeps only digits', () => {
    expect(onlyDigits('12ab-34 56')).toBe('123456');
  });

  it('formats card number in groups of 4', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('4242abcd')).toBe('4242');
  });

  it('detects visa brand', () => {
    expect(detectCardBrand('4242 4242 4242 4242')).toBe('visa');
  });

  it('detects mastercard brand by 51-55 and 2221-2720', () => {
    expect(detectCardBrand('5555555555554444')).toBe('mastercard');
    expect(detectCardBrand('2221000000000009')).toBe('mastercard');
  });

  it('returns unknown for unsupported prefixes', () => {
    expect(detectCardBrand('6011000000000000')).toBe('unknown');
  });

  it('returns logos only for known brands', () => {
    expect(getCardBrandLogo('visa')).toBeTruthy();
    expect(getCardBrandLogo('mastercard')).toBeTruthy();
    expect(getCardBrandLogo('unknown')).toBeNull();
  });

  it('validates card numbers by length and brand', () => {
    expect(isValidCardNumber('4242424242424242')).toBe(true);
    expect(isValidCardNumber('123')).toBe(false);
    expect(isValidCardNumber('6011000000000000')).toBe(false);
  });
});
