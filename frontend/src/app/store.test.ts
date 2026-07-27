import { describe, expect, it } from 'vitest';
import { store } from './store';

describe('app store', () => {
  it('exposes products and checkout state', () => {
    const state = store.getState();
    expect(state.products).toBeDefined();
    expect(state.checkout).toBeDefined();
    expect(state.checkout.step).toBe('product');
    expect(Array.isArray(state.products.items)).toBe(true);
  });
});
