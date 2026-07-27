import { describe, expect, it } from 'vitest';
import { isLettersAndSpaces, onlyLettersAndSpaces } from './text';

describe('text utils', () => {
  it('keeps letters accents and spaces only', () => {
    expect(onlyLettersAndSpaces('Juan123 Pérez!')).toBe('Juan Pérez');
    expect(onlyLettersAndSpaces('Bogotá-DC')).toBe('BogotáDC');
  });

  it('validates letters and spaces names', () => {
    expect(isLettersAndSpaces('Juan Pérez')).toBe(true);
    expect(isLettersAndSpaces('  María  ')).toBe(true);
    expect(isLettersAndSpaces('Juan123')).toBe(false);
    expect(isLettersAndSpaces('   ')).toBe(false);
  });
});
