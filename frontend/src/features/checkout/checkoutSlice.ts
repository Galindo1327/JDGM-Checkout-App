import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CardData,
  CheckoutStep,
  CustomerData,
  DeliveryData,
  Transaction,
} from '../../types/checkout';

interface CheckoutState {
  step: CheckoutStep;
  customer: CustomerData;
  delivery: DeliveryData;
  card: CardData;
  acceptedPrivacy: boolean;
  acceptedPersonalData: boolean;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  permalinkPrivacy: string;
  permalinkPersonalData: string;
  installments: number;
  transaction: Transaction | null;
  paying: boolean;
  error: string | null;
}

const initialState: CheckoutState = {
  step: 'product',
  customer: {
    name: '',
    email: '',
    phone: '',
  },
  delivery: {
    address: '',
    city: '',
    fee: 8000,
  },
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
  transaction: null,
  paying: false,
  error: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
    },
    setCustomer(state, action: PayloadAction<CustomerData>) {
      state.customer = action.payload;
    },
    setDelivery(state, action: PayloadAction<DeliveryData>) {
      state.delivery = action.payload;
    },
    setCard(state, action: PayloadAction<CardData>) {
      state.card = action.payload;
    },
    setAcceptedPrivacy(state, action: PayloadAction<boolean>) {
      state.acceptedPrivacy = action.payload;
    },
    setAcceptedPersonalData(state, action: PayloadAction<boolean>) {
      state.acceptedPersonalData = action.payload;
    },
    setAcceptanceTokens(
      state,
      action: PayloadAction<{
        acceptanceToken: string;
        acceptPersonalAuth: string;
        permalinkPrivacy: string;
        permalinkPersonalData: string;
      }>,
    ) {
      state.acceptanceToken = action.payload.acceptanceToken;
      state.acceptPersonalAuth = action.payload.acceptPersonalAuth;
      state.permalinkPrivacy = action.payload.permalinkPrivacy;
      state.permalinkPersonalData = action.payload.permalinkPersonalData;
    },
    setInstallments(state, action: PayloadAction<number>) {
      state.installments = action.payload;
    },
    setPaying(state, action: PayloadAction<boolean>) {
      state.paying = action.payload;
    },
    setTransaction(state, action: PayloadAction<Transaction | null>) {
      state.transaction = action.payload;
    },
    setCheckoutError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetCheckout(state) {
      state.step = 'product';
      state.customer = initialState.customer;
      state.delivery = initialState.delivery;
      state.card = initialState.card;
      state.acceptedPrivacy = false;
      state.acceptedPersonalData = false;
      state.acceptanceToken = '';
      state.acceptPersonalAuth = '';
      state.permalinkPrivacy = '';
      state.permalinkPersonalData = '';
      state.installments = 1;
      state.transaction = null;
      state.paying = false;
      state.error = null;
    },
  },
});

export const {
  setStep,
  setCustomer,
  setDelivery,
  setCard,
  setAcceptedPrivacy,
  setAcceptedPersonalData,
  setAcceptanceTokens,
  setInstallments,
  setPaying,
  setTransaction,
  setCheckoutError,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
