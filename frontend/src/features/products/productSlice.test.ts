import { describe, expect, it, vi, beforeEach } from 'vitest';
import productsReducer, {
  clearProductsError,
  fetchProducts,
  selectProduct,
} from './productSlice';

vi.mock('../../services/api', () => ({
  getProducts: vi.fn(),
}));

import { getProducts } from '../../services/api';

const mockedGetProducts = vi.mocked(getProducts);

describe('productSlice', () => {
  beforeEach(() => {
    mockedGetProducts.mockReset();
  });

  it('selects a product and clears error', () => {
    let state = productsReducer(undefined, selectProduct('p-2'));
    state = {
      ...state,
      error: 'prev',
    };
    state = productsReducer(state, clearProductsError());

    expect(state.selectedProductId).toBe('p-2');
    expect(state.error).toBeNull();
  });

  it('handles fetchProducts pending and fulfilled', async () => {
    const products = [
      {
        id: 'p-1',
        name: 'Camiseta Oversize',
        description: 'desc',
        price: 79900,
        stock: 15,
      },
    ];
    mockedGetProducts.mockResolvedValue(products);

    const pending = productsReducer(undefined, fetchProducts.pending('', undefined));
    expect(pending.loading).toBe(true);
    expect(pending.error).toBeNull();

    const fulfilled = productsReducer(
      pending,
      fetchProducts.fulfilled(products, '', undefined),
    );

    expect(fulfilled.loading).toBe(false);
    expect(fulfilled.items).toEqual(products);
    expect(fulfilled.selectedProductId).toBe('p-1');
  });

  it('keeps selected product when already set on fulfilled', () => {
    const products = [
      {
        id: 'p-1',
        name: 'Camiseta Oversize',
        description: 'desc',
        price: 79900,
        stock: 15,
      },
      {
        id: 'p-2',
        name: 'Gorra Classic',
        description: 'desc',
        price: 45000,
        stock: 30,
      },
    ];

    const state = productsReducer(
      {
        items: [],
        selectedProductId: 'p-2',
        loading: true,
        error: null,
      },
      fetchProducts.fulfilled(products, '', undefined),
    );

    expect(state.selectedProductId).toBe('p-2');
  });

  it('handles fetchProducts rejected', () => {
    const state = productsReducer(
      {
        items: [],
        selectedProductId: null,
        loading: true,
        error: null,
      },
      fetchProducts.rejected(new Error('Network down'), '', undefined),
    );

    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network down');
  });
});
