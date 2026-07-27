import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import ProductPage from './ProductPage';
import { createTestStore } from '../test/test-store';
import type { Product } from '../types/checkout';

vi.mock('../services/api', () => ({
  getProducts: vi.fn(),
}));

vi.mock('../components/CheckoutModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>Checkout abierto</div> : null,
}));

vi.mock('../components/SummaryDrawer', () => ({
  default: () => null,
}));

import { getProducts } from '../services/api';

const mockedGetProducts = vi.mocked(getProducts);

const camiseta: Product = {
  id: 'p-1',
  name: 'Camiseta Oversize',
  description: 'desc',
  price: 79900,
  stock: 15,
};

const reloj: Product = {
  id: 'p-2',
  name: 'Reloj de Lujo',
  description: 'desc',
  price: 1200000,
  stock: 8,
};

function renderWithProducts(products: Product[], selectedId = products[0]?.id) {
  mockedGetProducts.mockResolvedValue(products);

  const store = createTestStore({
    products: {
      items: products,
      selectedProductId: selectedId ?? null,
      loading: false,
      error: null,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    ),
  };
}

describe('ProductPage availability UI', () => {
  beforeEach(() => {
    mockedGetProducts.mockReset();
  });

  it('shows Disponible and pay button when stock is high', async () => {
    renderWithProducts([camiseta]);

    expect(await screen.findByText('Disponible')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pagar con tarjeta de crédito/i }),
    ).toBeEnabled();
  });

  it('shows Casi Agotado when stock is below 10', async () => {
    renderWithProducts([reloj]);

    expect(await screen.findByText('Casi Agotado')).toBeInTheDocument();
  });

  it('shows Agotado and disables pay button when out of stock', async () => {
    renderWithProducts([
      {
        id: 'p-3',
        name: 'Gorra Classic',
        description: 'desc',
        price: 45000,
        stock: 0,
      },
    ]);

    expect(await screen.findByText('Agotado')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sin existencias/i }),
    ).toBeDisabled();
  });

  it('opens checkout when paying an available product', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProducts([camiseta]);

    await screen.findByText('Disponible');
    await user.click(
      screen.getByRole('button', { name: /pagar con tarjeta de crédito/i }),
    );

    await waitFor(() => {
      expect(store.getState().checkout.step).toBe('checkout');
      expect(screen.getByText('Checkout abierto')).toBeInTheDocument();
    });
  });

  it('allows selecting another product from the catalog', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProducts([camiseta, reloj]);

    await screen.findByText('Más productos');
    await user.click(screen.getByRole('button', { name: /reloj de lujo/i }));

    await waitFor(() => {
      expect(store.getState().products.selectedProductId).toBe('p-2');
      expect(screen.getByText('Casi Agotado')).toBeInTheDocument();
    });
  });

  it('shows error state with retry action', async () => {
    mockedGetProducts.mockRejectedValue(new Error('fallo de red'));

    const store = createTestStore({
      products: {
        items: [],
        selectedProductId: null,
        loading: false,
        error: 'fallo de red',
      },
    });

    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    expect(
      await screen.findByText('No se pudieron cargar los productos'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
