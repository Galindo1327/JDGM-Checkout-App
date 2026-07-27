import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ get, post })),
  },
}));

import {
  createTransaction,
  getProducts,
  getTransaction,
} from './api';

describe('api service', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('gets products from /products', async () => {
    const products = [
      {
        id: 'p-1',
        name: 'Camiseta Oversize',
        description: 'desc',
        price: 79900,
        stock: 15,
      },
    ];
    get.mockResolvedValue({ data: products });

    await expect(getProducts()).resolves.toEqual(products);
    expect(get).toHaveBeenCalledWith('/products');
  });

  it('creates a transaction with payload', async () => {
    const payload = {
      productId: 'p-1',
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
      cardToken: 'tok_test',
      acceptanceToken: 'acc',
      acceptPersonalAuth: 'auth',
      installments: 3,
    };
    const transaction = {
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
    post.mockResolvedValue({ data: transaction });

    await expect(createTransaction(payload)).resolves.toEqual(transaction);
    expect(post).toHaveBeenCalledWith('/transactions', payload);
  });

  it('gets a transaction by id', async () => {
    const transaction = {
      id: 'tx-1',
      reference: 'txn_ref',
      productId: 'p-1',
      customerId: 'c-1',
      deliveryId: 'd-1',
      amount: 90900,
      baseFee: 3000,
      deliveryFee: 8000,
      installments: 1,
      status: 'DECLINED',
      providerPaymentId: null,
    };
    get.mockResolvedValue({ data: transaction });

    await expect(getTransaction('tx-1')).resolves.toEqual(transaction);
    expect(get).toHaveBeenCalledWith('/transactions/tx-1');
  });
});
