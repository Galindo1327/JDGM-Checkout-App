import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import CheckoutModal from './CheckoutModal';
import { createTestStore } from '../test/test-store';

vi.mock('../services/wompi', () => ({
  getAcceptanceTokens: vi.fn(),
}));

import { getAcceptanceTokens } from '../services/wompi';

const mockedTokens = vi.mocked(getAcceptanceTokens);

describe('CheckoutModal', () => {
  beforeEach(() => {
    mockedTokens.mockReset();
  });

  it('loads acceptance tokens and keeps continue disabled initially', async () => {
    mockedTokens.mockResolvedValue({
      acceptanceToken: 'acc',
      acceptPersonalAuth: 'auth',
      permalinkPrivacy: 'https://privacy',
      permalinkPersonalData: 'https://personal',
    });

    render(
      <Provider store={createTestStore()}>
        <CheckoutModal open onClose={vi.fn()} onContinue={vi.fn()} />
      </Provider>,
    );

    expect(
      screen.getByRole('button', { name: /continuar al resumen/i }),
    ).toBeDisabled();

    await waitFor(() => {
      expect(mockedTokens).toHaveBeenCalled();
    });

    expect(screen.getByText(/cuotas/i)).toBeInTheDocument();
    expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
  });

  it('shows error when acceptance tokens fail to load', async () => {
    mockedTokens.mockRejectedValue(new Error('fail'));

    render(
      <Provider store={createTestStore()}>
        <CheckoutModal open onClose={vi.fn()} onContinue={vi.fn()} />
      </Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no se pudieron cargar las políticas/i),
      ).toBeInTheDocument();
    });
  });

  it('enables continue and saves checkout data when form is valid', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const onClose = vi.fn();

    mockedTokens.mockResolvedValue({
      acceptanceToken: 'acc',
      acceptPersonalAuth: 'auth',
      permalinkPrivacy: 'https://privacy',
      permalinkPersonalData: 'https://personal',
    });

    const store = createTestStore({
      checkout: {
        step: 'checkout',
        customer: {
          name: 'Juan Perez',
          email: 'juan@test.com',
          phone: '3001234567',
        },
        delivery: {
          address: 'Calle 123',
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
        acceptanceToken: '',
        acceptPersonalAuth: '',
        permalinkPrivacy: '',
        permalinkPersonalData: '',
        installments: 3,
        transaction: null,
        paying: false,
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <CheckoutModal open onClose={onClose} onContinue={onContinue} />
      </Provider>,
    );

    await waitFor(() => {
      expect(store.getState().checkout.acceptanceToken).toBe('acc');
    });

    const continueButton = screen.getByRole('button', {
      name: /continuar al resumen/i,
    });

    await waitFor(() => {
      expect(continueButton).toBeEnabled();
    });

    await user.click(continueButton);

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
      expect(store.getState().checkout.step).toBe('summary');
      expect(store.getState().checkout.installments).toBe(3);
      expect(store.getState().checkout.customer.phone).toBe('3001234567');
    });
  });

  it('calls onClose when close button is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockedTokens.mockResolvedValue({
      acceptanceToken: 'acc',
      acceptPersonalAuth: 'auth',
      permalinkPrivacy: 'https://privacy',
      permalinkPersonalData: 'https://personal',
    });

    render(
      <Provider store={createTestStore()}>
        <CheckoutModal open onClose={onClose} onContinue={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
