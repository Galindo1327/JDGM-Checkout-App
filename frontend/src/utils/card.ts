import mastercardLogo from '../assets/CardsLogos/logo-Mastercard.png';
import visaLogo from '../assets/CardsLogos/VISA-logo.png';

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCardNumber(value: string): string {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function detectCardBrand(number: string): CardBrand {
  const digits = onlyDigits(number);

  if (digits.startsWith('4')) {
    return 'visa';
  }

  if (/^5[1-5]/.test(digits)) {
    return 'mastercard';
  }

  if (digits.length >= 4) {
    const prefix = Number(digits.slice(0, 4));
    if (prefix >= 2221 && prefix <= 2720) {
      return 'mastercard';
    }
  }

  if (digits.length >= 2) {
    const prefix2 = Number(digits.slice(0, 2));
    if (prefix2 >= 22 && prefix2 <= 27) {
      return 'mastercard';
    }
  }

  return 'unknown';
}

export function getCardBrandLogo(brand: CardBrand): string | null {
  if (brand === 'visa') return visaLogo;
  if (brand === 'mastercard') return mastercardLogo;
  return null;
}

export function isValidCardNumber(number: string): boolean {
  const digits = onlyDigits(number);
  if (digits.length < 13 || digits.length > 19) return false;
  const brand = detectCardBrand(digits);
  return brand === 'visa' || brand === 'mastercard';
}
