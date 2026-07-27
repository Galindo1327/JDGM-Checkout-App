import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer from '../features/checkout/checkoutSlice';
import productsReducer from '../features/products/productSlice';
import type { RootState } from '../app/store';

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      products: productsReducer,
      checkout: checkoutReducer,
    },
    preloadedState: preloadedState as RootState | undefined,
  });
}
