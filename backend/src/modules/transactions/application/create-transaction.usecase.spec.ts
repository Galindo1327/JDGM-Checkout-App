import { Product } from '../../products/domain/product.entity';
import type { ProductRepository } from '../../products/domain/product.repository';
import type { PaymentGateway } from '../domain/payment-gateway';
import { Transaction } from '../domain/transaction.entity';
import type { TransactionRepository } from '../domain/transaction.repository';
import {
  BASE_FEE,
  CreateTransactionUseCase,
  DEFAULT_DELIVERY_FEE,
} from './create-transaction.usecase';

describe('CreateTransactionUseCase', () => {
  const products: jest.Mocked<ProductRepository> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    decrementStock: jest.fn(),
  };

  const transactions: jest.Mocked<TransactionRepository> = {
    createPending: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
  };

  const paymentGateway: jest.Mocked<PaymentGateway> = {
    createTransaction: jest.fn(),
    getTransaction: jest.fn(),
  };

  const command = {
    productId: 'product-1',
    customer: {
      name: 'Testing',
      email: 'testing@example.com',
      phone: '3001234567',
    },
    delivery: {
      address: 'Calle 1',
      city: 'Bogota',
      fee: 8000,
    },
    cardToken: 'tok_test',
    acceptanceToken: 'acceptance',
    acceptPersonalAuth: 'personal',
    installments: 1,
  };

  const product = new Product('product-1', 'Camiseta', 'Oversize', 79900, 15);

  let useCase: CreateTransactionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateTransactionUseCase(
      products,
      transactions,
      paymentGateway,
    );
  });

  it('returns error when product does not exist', async () => {
    products.findById.mockResolvedValue(null);

    const result = await useCase.execute(command);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('Producto no encontrado');
  });

  it('returns error when product has no stock', async () => {
    products.findById.mockResolvedValue(
      new Product('product-1', 'Camiseta', 'Oversize', 79900, 0),
    );

    const result = await useCase.execute(command);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe(
      'Producto sin stock disponible',
    );
  });

  it('approves payment and decrements stock', async () => {
    const pending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'PENDING',
      null,
    );
    const approved = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'APPROVED',
      'wompi-1',
    );

    products.findById.mockResolvedValue(product);
    transactions.createPending.mockResolvedValue(pending);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-1',
      status: 'APPROVED',
    });
    transactions.updateStatus.mockResolvedValue(approved);
    products.decrementStock.mockResolvedValue();

    const result = await useCase.execute(command);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe('APPROVED');
    expect(products.decrementStock).toHaveBeenCalledWith('product-1', 1);
    expect(paymentGateway.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInCents: 90900 * 100,
        currency: 'COP',
        cardToken: 'tok_test',
        installments: 1,
      }),
    );
  });

  it('does not decrement stock when payment is declined', async () => {
    const pending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'PENDING',
      null,
    );
    const declined = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'DECLINED',
      'wompi-2',
    );

    products.findById.mockResolvedValue(product);
    transactions.createPending.mockResolvedValue(pending);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-2',
      status: 'DECLINED',
    });
    transactions.updateStatus.mockResolvedValue(declined);

    const result = await useCase.execute(command);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe('DECLINED');
    expect(products.decrementStock).not.toHaveBeenCalled();
  });

  it('marks transaction as ERROR when Wompi create fails', async () => {
    const pending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'PENDING',
      null,
    );
    const errored = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'ERROR',
      null,
    );

    products.findById.mockResolvedValue(product);
    transactions.createPending.mockResolvedValue(pending);
    paymentGateway.createTransaction.mockRejectedValue(
      new Error('Token inválido'),
    );
    transactions.updateStatus.mockResolvedValue(errored);

    const result = await useCase.execute(command);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('Token inválido');
    expect(transactions.updateStatus).toHaveBeenCalledWith('tx-1', 'ERROR');
    expect(products.decrementStock).not.toHaveBeenCalled();
  });

  it('polls Wompi when initial status is PENDING', async () => {
    const pending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'PENDING',
      null,
    );
    const stillPending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'PENDING',
      'wompi-3',
    );
    const approved = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'APPROVED',
      'wompi-3',
    );

    products.findById.mockResolvedValue(product);
    transactions.createPending.mockResolvedValue(pending);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-3',
      status: 'PENDING',
    });
    transactions.updateStatus
      .mockResolvedValueOnce(stillPending)
      .mockResolvedValueOnce(approved);
    paymentGateway.getTransaction.mockResolvedValue({
      id: 'wompi-3',
      status: 'APPROVED',
    });
    products.decrementStock.mockResolvedValue();

    const result = await useCase.execute(command);

    expect(result.isOk()).toBe(true);
    expect(paymentGateway.getTransaction).toHaveBeenCalledWith('wompi-3');
    expect(products.decrementStock).toHaveBeenCalledWith('product-1', 1);
  });

  it('maps VOIDED and ERROR statuses without decrementing stock', async () => {
    const pending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'PENDING',
      null,
    );
    const voided = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      90900,
      BASE_FEE,
      8000,
      1,
      'VOIDED',
      'wompi-5',
    );

    products.findById.mockResolvedValue(product);
    transactions.createPending.mockResolvedValue(pending);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-5',
      status: 'VOIDED',
    });
    transactions.updateStatus.mockResolvedValue(voided);

    const result = await useCase.execute(command);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe('VOIDED');
    expect(products.decrementStock).not.toHaveBeenCalled();
  });

  it('returns generic error when unexpected exception is thrown', async () => {
    products.findById.mockRejectedValue('boom');

    const result = await useCase.execute(command);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe(
      'No se pudo crear la transacción',
    );
  });

  it('uses default delivery fee when fee is omitted', async () => {
    const pending = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      product.price + BASE_FEE + DEFAULT_DELIVERY_FEE,
      BASE_FEE,
      DEFAULT_DELIVERY_FEE,
      1,
      'PENDING',
      null,
    );
    const approved = new Transaction(
      'tx-1',
      'txn_ref',
      'product-1',
      'customer-1',
      'delivery-1',
      product.price + BASE_FEE + DEFAULT_DELIVERY_FEE,
      BASE_FEE,
      DEFAULT_DELIVERY_FEE,
      1,
      'APPROVED',
      'wompi-4',
    );

    products.findById.mockResolvedValue(product);
    transactions.createPending.mockResolvedValue(pending);
    paymentGateway.createTransaction.mockResolvedValue({
      id: 'wompi-4',
      status: 'APPROVED',
    });
    transactions.updateStatus.mockResolvedValue(approved);
    products.decrementStock.mockResolvedValue();

    const { fee: _fee, ...deliveryWithoutFee } = command.delivery;
    await useCase.execute({
      ...command,
      delivery: deliveryWithoutFee,
    });

    expect(transactions.createPending).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryFee: DEFAULT_DELIVERY_FEE,
        amount: product.price + BASE_FEE + DEFAULT_DELIVERY_FEE,
        installments: 1,
      }),
    );
  });
});
