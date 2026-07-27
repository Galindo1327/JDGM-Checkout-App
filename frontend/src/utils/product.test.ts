import { describe, expect, it } from 'vitest';
import {
  BASE_FEE,
  calculateCheckoutTotal,
  formatCop,
  getAvailabilityTag,
  getPaymentStatusMeta,
  getProductImage,
} from './product';

describe('product utils', () => {
  it('resolves known product images', () => {
    expect(getProductImage('Camiseta Oversize')).toBeTruthy();
    expect(getProductImage('Gorra Classic')).toBeTruthy();
    expect(getProductImage('Pantalones Jean')).toBeTruthy();
    expect(getProductImage('Reloj de Lujo')).toBeTruthy();
    expect(getProductImage('Par de Zapatillas')).toBeTruthy();
  });

  it('returns undefined for unknown products', () => {
    expect(getProductImage('Producto Inventado')).toBeUndefined();
  });

  it('formats COP currency', () => {
    const formatted = formatCop(79900);
    expect(formatted).toContain('79');
    expect(formatted).toMatch(/\$|COP/);
  });

  it('maps availability by stock', () => {
    expect(getAvailabilityTag(0)).toEqual({
      label: 'Agotado',
      color: 'error',
    });
    expect(getAvailabilityTag(8)).toEqual({
      label: 'Casi Agotado',
      color: 'warning',
    });
    expect(getAvailabilityTag(15)).toEqual({
      label: 'Disponible',
      color: 'success',
    });
  });

  it('calculates checkout total with fees', () => {
    expect(calculateCheckoutTotal(79900)).toBe(79900 + BASE_FEE + 8000);
    expect(calculateCheckoutTotal(100000, 5000, 2000)).toBe(107000);
  });

  it('maps payment status metadata', () => {
    expect(getPaymentStatusMeta('APPROVED').tone).toBe('approved');
    expect(getPaymentStatusMeta('DECLINED').tone).toBe('declined');
    expect(getPaymentStatusMeta('ERROR').label).toBe('Error en el pago');
    expect(getPaymentStatusMeta('PENDING').tone).toBe('other');
  });
});
