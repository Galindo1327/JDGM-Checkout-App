import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WompiPaymentGateway } from './wompi-payment.gateway';

jest.mock('axios');

describe('WompiPaymentGateway', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const http = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const config = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        WOMPI_SANDBOX_URL: 'https://api-sandbox.test/v1',
        WOMPI_PRIVATE_KEY: 'prv_test',
        WOMPI_PUBLIC_KEY: 'pub_test',
        WOMPI_INTEGRITY_KEY: 'integrity_test',
      };
      return values[key];
    }),
  };

  let gateway: WompiPaymentGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(http as never);
    mockedAxios.isAxiosError.mockImplementation(
      (payload: unknown): payload is never =>
        Boolean(
          payload &&
            typeof payload === 'object' &&
            'isAxiosError' in payload &&
            (payload as { isAxiosError?: boolean }).isAxiosError,
        ),
    );
    gateway = new WompiPaymentGateway(config as unknown as ConfigService);
  });

  it('creates a transaction with integrity signature', async () => {
    http.post.mockResolvedValue({
      data: {
        data: {
          id: 'wompi-1',
          status: 'APPROVED',
          status_message: 'ok',
        },
      },
    });

    const input = {
      amountInCents: 9090000,
      currency: 'COP',
      reference: 'txn_abc',
      customerEmail: 'test@example.com',
      cardToken: 'tok_test',
      acceptanceToken: 'acceptance',
      acceptPersonalAuth: 'personal',
      installments: 1,
      customerFullName: 'Testing',
      customerPhone: '3001234567',
    };

    const result = await gateway.createTransaction(input);
    const expectedSignature = createHash('sha256')
      .update(
        `${input.reference}${input.amountInCents}${input.currency}integrity_test`,
      )
      .digest('hex');

    expect(result).toEqual({
      id: 'wompi-1',
      status: 'APPROVED',
      statusMessage: 'ok',
    });
    expect(http.post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({
        signature: expectedSignature,
        amount_in_cents: 9090000,
        acceptance_token: 'acceptance',
        accept_personal_auth: 'personal',
        payment_method: {
          type: 'CARD',
          token: 'tok_test',
          installments: 1,
        },
      }),
      {
        headers: { Authorization: 'Bearer prv_test' },
      },
    );
  });

  it('gets a transaction by id', async () => {
    http.get.mockResolvedValue({
      data: {
        data: {
          id: 'wompi-1',
          status: 'DECLINED',
          status_message: 'rejected',
        },
      },
    });

    const result = await gateway.getTransaction('wompi-1');

    expect(result).toEqual({
      id: 'wompi-1',
      status: 'DECLINED',
      statusMessage: 'rejected',
    });
    expect(http.get).toHaveBeenCalledWith('/transactions/wompi-1', {
      headers: { Authorization: 'Bearer pub_test' },
    });
  });

  it('throws when create response is invalid', async () => {
    http.post.mockResolvedValue({ data: {} });

    await expect(
      gateway.createTransaction({
        amountInCents: 100,
        currency: 'COP',
        reference: 'txn_x',
        customerEmail: 'a@b.com',
        cardToken: 'tok',
        acceptanceToken: 'a',
        acceptPersonalAuth: 'b',
        installments: 1,
        customerFullName: 'A',
        customerPhone: '1',
      }),
    ).rejects.toThrow('Respuesta inválida de Wompi al crear la transacción');
  });

  it('throws when get response is invalid', async () => {
    http.get.mockResolvedValue({ data: {} });

    await expect(gateway.getTransaction('wompi-1')).rejects.toThrow(
      'Respuesta inválida de Wompi al consultar la transacción',
    );
  });

  it('maps axios reason and generic errors', async () => {
    http.get.mockRejectedValue({
      isAxiosError: true,
      message: 'network',
      response: {
        data: {
          error: { reason: 'timeout' },
        },
      },
    });

    await expect(gateway.getTransaction('wompi-1')).rejects.toThrow('timeout');

    http.get.mockRejectedValue(new Error('fallo local'));
    await expect(gateway.getTransaction('wompi-1')).rejects.toThrow(
      'fallo local',
    );
  });

  it('maps axios error messages', async () => {
    http.post.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed',
      response: {
        data: {
          error: {
            messages: ['reference already used'],
          },
        },
      },
    });

    await expect(
      gateway.createTransaction({
        amountInCents: 100,
        currency: 'COP',
        reference: 'txn_x',
        customerEmail: 'a@b.com',
        cardToken: 'tok',
        acceptanceToken: 'a',
        acceptPersonalAuth: 'b',
        installments: 1,
        customerFullName: 'A',
        customerPhone: '1',
      }),
    ).rejects.toThrow('reference already used');
  });
});
