import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreateTransactionUseCase } from '../../application/create-transaction.usecase';
import { Transaction } from '../../domain/transaction.entity';
import type { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionsController } from './transactions.controller';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsController', () => {
  const useCase = {
    execute: jest.fn(),
  };

  const transactions: jest.Mocked<TransactionRepository> = {
    createPending: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
  };

  let controller: TransactionsController;

  const dto = {
    productId: '3ddd2a57-e6cd-4e30-ae6c-573fe21bb8fb',
    customer: {
      name: 'Testing',
      email: 'testing34@yopmail.com',
      phone: '3001234567',
    },
    delivery: {
      address: 'Calle 123',
      city: 'Bogota',
      fee: 8000,
    },
    cardToken: 'tok_test',
    acceptanceToken: 'acceptance',
    acceptPersonalAuth: 'personal',
    installments: 1,
  } as CreateTransactionDto;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TransactionsController(
      useCase as unknown as CreateTransactionUseCase,
      transactions,
    );
  });

  it('creates a transaction', async () => {
    const transaction = new Transaction(
      'tx-1',
      'txn_ref',
      dto.productId,
      'customer-1',
      'delivery-1',
      90900,
      3000,
      8000,
      1,
      'APPROVED',
      'wompi-1',
    );
    useCase.execute.mockResolvedValue(ok(transaction));

    await expect(controller.create(dto)).resolves.toEqual(transaction);
    expect(useCase.execute).toHaveBeenCalledWith({
      productId: dto.productId,
      customer: dto.customer,
      delivery: dto.delivery,
      cardToken: dto.cardToken,
      acceptanceToken: dto.acceptanceToken,
      acceptPersonalAuth: dto.acceptPersonalAuth,
      installments: dto.installments,
    });
  });

  it('throws BadRequestException when use case fails', async () => {
    useCase.execute.mockResolvedValue(err(new Error('Sin stock')));

    await expect(controller.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns transaction by id', async () => {
    const transaction = new Transaction(
      'tx-1',
      'txn_ref',
      dto.productId,
      'customer-1',
      'delivery-1',
      90900,
      3000,
      8000,
      1,
      'APPROVED',
      'wompi-1',
    );
    transactions.findById.mockResolvedValue(transaction);

    await expect(controller.findOne('tx-1')).resolves.toEqual(transaction);
  });

  it('throws NotFoundException when transaction does not exist', async () => {
    transactions.findById.mockResolvedValue(null);

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
