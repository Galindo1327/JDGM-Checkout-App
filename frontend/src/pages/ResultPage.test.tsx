import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import ResultPage from './ResultPage';
import { createTestStore } from '../test/test-store';
import type { Transaction } from '../types/checkout';

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

const baseTransaction: Transaction = {
  id: 'tx-1',
  reference: 'txn_ref_123',
  productId: 'p-1',
  customerId: 'c-1',
  deliveryId: 'd-1',
  amount: 90900,
  baseFee: 3000,
  deliveryFee: 8000,
  installments: 3,
  status: 'APPROVED',
  providerPaymentId: 'pay-1',
};

function renderResult(transaction: Transaction | null) {
  const store = createTestStore({
    checkout: {
      step: 'result',
      customer: { name: '', email: '', phone: '' },
      delivery: { address: '', city: '', fee: 8000 },
      card: {
        number: '',
        cvc: '',
        expMonth: '',
        expYear: '',
        cardHolder: '',
      },
      acceptedPrivacy: false,
      acceptedPersonalData: false,
      acceptanceToken: '',
      acceptPersonalAuth: '',
      permalinkPrivacy: '',
      permalinkPersonalData: '',
      installments: 1,
      transaction,
      paying: false,
      error: null,
    },
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
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ResultPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('ResultPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('redirects to home when there is no transaction', () => {
    renderResult(null);
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows approved status and installments', () => {
    renderResult(baseTransaction);
    expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
    expect(screen.getByText('3 cuotas')).toBeInTheDocument();
    expect(screen.getByText(/txn_ref_123/)).toBeInTheDocument();
  });

  it('shows declined status', () => {
    renderResult({ ...baseTransaction, status: 'DECLINED', installments: 1 });
    expect(screen.getByText('Pago declinado')).toBeInTheDocument();
    expect(screen.getByText('1 cuota')).toBeInTheDocument();
  });

  it('resets checkout and navigates home on back button', async () => {
    const user = userEvent.setup();
    renderResult(baseTransaction);

    await user.click(
      screen.getByRole('button', { name: /volver al comercio/i }),
    );

    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
