import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getProducts } from '../../services/api';
import type { Product } from '../../types/checkout';

interface ProductsState {
  items: Product[];
  selectedProductId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  selectedProductId: null,
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => getProducts(),
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    selectProduct(state, action: { payload: string }) {
      state.selectedProductId = action.payload;
    },
    clearProductsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        if (!state.selectedProductId && action.payload.length > 0) {
          state.selectedProductId = action.payload[0].id;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'No se pudieron cargar los productos';
      });
  },
});

export const { selectProduct, clearProductsError } = productsSlice.actions;
export default productsSlice.reducer;
