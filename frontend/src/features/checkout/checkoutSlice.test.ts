import { describe, expect, it } from 'vitest';
import checkoutReducer, {
  resetCheckout,
  setAcceptanceTokens,
  setAcceptedPersonalData,
  setAcceptedPrivacy,
  setCard,
  setCheckoutError,
  setCustomer,
  setDelivery,
  setInstallments,
  setPaying,
  setStep,
  setTransaction,
} from './checkoutSlice';
import type { Transaction } from '../../types/checkout';

const transaction: Transaction = {
  id: 'tx-1',
  reference: 'txn_ref',
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

describe('checkoutSlice', () => {
  it('updates customer, delivery, card and installments', () => {
    let state = checkoutReducer(undefined, { type: 'unknown' });

    state = checkoutReducer(
      state,
      setCustomer({
        name: 'Juan',
        email: 'juan@test.com',
        phone: '3001234567',
      }),
    );
    state = checkoutReducer(
      state,
      setDelivery({ address: 'Calle 1', city: 'Bogota', fee: 8000 }),
    );
    state = checkoutReducer(
      state,
      setCard({
        number: '4242 4242 4242 4242',
        cvc: '123',
        expMonth: '12',
        expYear: '30',
        cardHolder: 'Juan',
      }),
    );
    state = checkoutReducer(state, setInstallments(6));

    expect(state.customer.name).toBe('Juan');
    expect(state.delivery.city).toBe('Bogota');
    expect(state.card.number).toContain('4242');
    expect(state.installments).toBe(6);
  });

  it('moves through checkout steps and stores tokens', () => {
    let state = checkoutReducer(undefined, setStep('checkout'));
    expect(state.step).toBe('checkout');

    state = checkoutReducer(state, setStep('summary'));
    state = checkoutReducer(state, setAcceptedPrivacy(true));
    state = checkoutReducer(state, setAcceptedPersonalData(true));
    state = checkoutReducer(
      state,
      setAcceptanceTokens({
        acceptanceToken: 'acc',
        acceptPersonalAuth: 'auth',
        permalinkPrivacy: 'https://privacy',
        permalinkPersonalData: 'https://personal',
      }),
    );

    expect(state.step).toBe('summary');
    expect(state.acceptedPrivacy).toBe(true);
    expect(state.acceptanceToken).toBe('acc');
    expect(state.acceptPersonalAuth).toBe('auth');
  });

  it('stores transaction, paying and error states', () => {
    let state = checkoutReducer(undefined, setPaying(true));
    state = checkoutReducer(state, setTransaction(transaction));
    state = checkoutReducer(state, setCheckoutError('fallo'));
    state = checkoutReducer(state, setStep('result'));

    expect(state.paying).toBe(true);
    expect(state.transaction?.status).toBe('APPROVED');
    expect(state.error).toBe('fallo');
    expect(state.step).toBe('result');
  });

  it('resets checkout to initial values', () => {
    let state = checkoutReducer(undefined, setInstallments(12));
    state = checkoutReducer(state, setTransaction(transaction));
    state = checkoutReducer(state, setPaying(true));
    state = checkoutReducer(state, resetCheckout());

    expect(state.step).toBe('product');
    expect(state.installments).toBe(1);
    expect(state.transaction).toBeNull();
    expect(state.paying).toBe(false);
    expect(state.error).toBeNull();
    expect(state.customer.name).toBe('');
  });
});
