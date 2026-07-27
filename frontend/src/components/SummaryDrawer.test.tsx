import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import SummaryDrawer from './SummaryDrawer';
import { createTestStore } from '../test/test-store';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../services/wompi', () => ({
  tokenizeCard: vi.fn(),
}));

vi.mock('../services/api', () => ({
  createTransaction: vi.fn(),
}));

vi.mock('../features/products/productSlice', async () => {
  const actual = await vi.importActual<
    typeof import('../features/products/productSlice')
  >('../features/products/productSlice');
  return {
    ...actual,
    fetchProducts: Object.assign(
      () => ({ type: 'test/skip-fetch-products' }),
      {
        pending: actual.fetchProducts.pending,
        fulfilled: actual.fetchProducts.fulfilled,
        rejected: actual.fetchProducts.rejected,
        typePrefix: 'products/fetchProducts',
      },
    ),
  };
});

import { tokenizeCard } from '../services/wompi';
import { createTransaction } from '../services/api';

const mockedTokenize = vi.mocked(tokenizeCard);
const mockedCreate = vi.mocked(createTransaction);

function renderSummary() {
  const store = createTestStore({
    products: {
      items: [
        {
          id: 'p-1',
          name: 'Camiseta Oversize',
          description: 'Algodón',
          price: 79900,
          stock: 15,
        },
      ],
      selectedProductId: 'p-1',
      loading: false,
      error: null,
    },
    checkout: {
      step: 'summary',
      customer: {
        name: 'Juan',
        email: 'juan@test.com',
        phone: '3001234567',
      },
      delivery: {
        address: 'Calle 1',
        city: 'Bogota',
        fee: 8000,
      },
      card: {
        number: '4242 4242 4242 4242',
        cvc: '123',
        expMonth: '12',
        expYear: '30',
        cardHolder: 'Juan Perez',
      },
      acceptedPrivacy: true,
      acceptedPersonalData: true,
      acceptanceToken: 'acc',
      acceptPersonalAuth: 'auth',
      permalinkPrivacy: 'https://privacy',
      permalinkPersonalData: 'https://personal',
      installments: 6,
      transaction: null,
      paying: false,
      error: null,
    },
  });

  const product = store.getState().products.items[0];

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SummaryDrawer open product={product} onClose={vi.fn()} />
      </MemoryRouter>
    </Provider>,
  );
}

describe('SummaryDrawer', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockedTokenize.mockReset();
    mockedCreate.mockReset();
  });

  it('shows totals and selected installments', () => {
    renderSummary();
    expect(screen.getByText('6 cuotas')).toBeInTheDocument();
    expect(screen.getByText('Resumen de pago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pagar ahora/i })).toBeEnabled();
  });

  it('tokenizes, creates transaction and navigates to result', async () => {
    const user = userEvent.setup();
    mockedTokenize.mockResolvedValue('tok_123');
    mockedCreate.mockResolvedValue({
      id: 'tx-1',
      reference: 'txn_ref',
      productId: 'p-1',
      customerId: 'c-1',
      deliveryId: 'd-1',
      amount: 90900,
      baseFee: 3000,
      deliveryFee: 8000,
      installments: 6,
      status: 'APPROVED',
      wompiId: 'wompi-1',
    });

    renderSummary();
    await user.click(screen.getByRole('button', { name: /pagar ahora/i }));

    await waitFor(() => {
      expect(mockedTokenize).toHaveBeenCalled();
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'p-1',
          installments: 6,
          cardToken: 'tok_123',
        }),
      );
      expect(navigateMock).toHaveBeenCalledWith('/result');
    });
  });

  it('shows error message when payment fails', async () => {
    const user = userEvent.setup();
    mockedTokenize.mockRejectedValue(new Error('Token inválido'));

    renderSummary();
    await user.click(screen.getByRole('button', { name: /pagar ahora/i }));

    await waitFor(() => {
      expect(screen.getByText('Error al pagar')).toBeInTheDocument();
      expect(screen.getByText('Token inválido')).toBeInTheDocument();
    });
  });
});
