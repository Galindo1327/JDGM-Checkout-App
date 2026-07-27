import { PrismaService } from '../../../../shared/prisma.service';
import { PrismaTransactionRepository } from './prisma-transaction.repository';

describe('PrismaTransactionRepository', () => {
  const tx = {
    customer: { create: jest.fn() },
    delivery: { create: jest.fn() },
    transaction: { create: jest.fn() },
  };

  const prisma = {
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    transaction: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  let repository: PrismaTransactionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaTransactionRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('creates customer, delivery and pending transaction', async () => {
    tx.customer.create.mockResolvedValue({ id: 'customer-1' });
    tx.delivery.create.mockResolvedValue({ id: 'delivery-1' });
    tx.transaction.create.mockResolvedValue({
      id: 'tx-1',
      reference: 'txn_ref',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      amount: 90900,
      baseFee: 3000,
      deliveryFee: 8000,
      installments: 1,
      status: 'PENDING',
      providerPaymentId: null,
    });

    const result = await repository.createPending({
      reference: 'txn_ref',
      productId: 'product-1',
      customer: {
        name: 'Testing',
        email: 'test@example.com',
        phone: '3001234567',
      },
      delivery: {
        address: 'Calle 1',
        city: 'Bogota',
        fee: 8000,
      },
      amount: 90900,
      baseFee: 3000,
      deliveryFee: 8000,
      installments: 1,
    });

    expect(result.status).toBe('PENDING');
    expect(result.installments).toBe(1);
    expect(result.id).toBe('tx-1');
    expect(tx.customer.create).toHaveBeenCalled();
    expect(tx.delivery.create).toHaveBeenCalled();
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ installments: 1 }),
    });
  });

  it('updates transaction status and provider payment id', async () => {
    prisma.transaction.update.mockResolvedValue({
      id: 'tx-1',
      reference: 'txn_ref',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      amount: 90900,
      baseFee: 3000,
      deliveryFee: 8000,
      installments: 1,
      status: 'APPROVED',
      providerPaymentId: 'pay-1',
    });

    const result = await repository.updateStatus('tx-1', 'APPROVED', 'pay-1');

    expect(result.status).toBe('APPROVED');
    expect(result.providerPaymentId).toBe('pay-1');
  });

  it('finds transaction by id', async () => {
    prisma.transaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      reference: 'txn_ref',
      productId: 'product-1',
      customerId: 'customer-1',
      deliveryId: 'delivery-1',
      amount: 90900,
      baseFee: 3000,
      deliveryFee: 8000,
      installments: 3,
      status: 'APPROVED',
      providerPaymentId: 'pay-1',
    });

    const result = await repository.findById('tx-1');

    expect(result?.id).toBe('tx-1');
    expect(result?.installments).toBe(3);
  });

  it('returns null when transaction does not exist', async () => {
    prisma.transaction.findUnique.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });
});
