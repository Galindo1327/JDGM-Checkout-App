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

import { getAcceptanceTokens, tokenizeCard } from './wompi';

describe('wompi service', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('maps acceptance tokens from merchant endpoint', async () => {
    get.mockResolvedValue({
      data: {
        data: {
          presigned_acceptance: {
            acceptance_token: 'acc-token',
            permalink: 'https://privacy',
          },
          presigned_personal_data_auth: {
            acceptance_token: 'auth-token',
            permalink: 'https://personal',
          },
        },
      },
    });

    await expect(getAcceptanceTokens()).resolves.toEqual({
      acceptanceToken: 'acc-token',
      acceptPersonalAuth: 'auth-token',
      permalinkPrivacy: 'https://privacy',
      permalinkPersonalData: 'https://personal',
    });
  });

  it('tokenizes card and removes spaces from number', async () => {
    post.mockResolvedValue({
      data: { data: { id: 'tok_test_123' } },
    });

    await expect(
      tokenizeCard({
        number: '4242 4242 4242 4242',
        cvc: '123',
        expMonth: '12',
        expYear: '30',
        cardHolder: 'Juan Perez',
      }),
    ).resolves.toBe('tok_test_123');

    expect(post).toHaveBeenCalledWith(
      '/tokens/cards',
      expect.objectContaining({
        number: '4242424242424242',
        cvc: '123',
        exp_month: '12',
        exp_year: '30',
        card_holder: 'Juan Perez',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      }),
    );
  });

  it('throws when tokenization response has no token id', async () => {
    post.mockResolvedValue({ data: { data: {} } });

    await expect(
      tokenizeCard({
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '30',
        cardHolder: 'Juan',
      }),
    ).rejects.toThrow('No se pudo tokenizar la tarjeta');
  });
});
