import { Injectable } from '@nestjs/common';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import type {
  CreatePendingTransactionInput,
  TransactionRepository,
} from '../../domain/transaction.repository';
import { PrismaService } from '../../../../shared/prisma.service';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(
    input: CreatePendingTransactionInput,
  ): Promise<Transaction> {
    const row = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
        },
      });

      const delivery = await tx.delivery.create({
        data: {
          customerId: customer.id,
          address: input.delivery.address,
          city: input.delivery.city,
          fee: input.delivery.fee,
        },
      });

      return tx.transaction.create({
        data: {
          reference: input.reference,
          productId: input.productId,
          customerId: customer.id,
          deliveryId: delivery.id,
          amount: input.amount,
          baseFee: input.baseFee,
          deliveryFee: input.deliveryFee,
          installments: input.installments,
          status: 'PENDING',
        },
      });
    });

    return this.toEntity(row);
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    providerPaymentId?: string,
  ): Promise<Transaction> {
    const row = await this.prisma.transaction.update({
      where: { id },
      data: {
        status,
        ...(providerPaymentId !== undefined ? { providerPaymentId } : {}),
      },
    });
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    if (!row) return null;
    return this.toEntity(row);
  }

  private toEntity(row: {
    id: string;
    reference: string;
    productId: string;
    customerId: string;
    deliveryId: string;
    amount: number;
    baseFee: number;
    deliveryFee: number;
    installments: number;
    status: string;
    providerPaymentId: string | null;
  }): Transaction {
    return new Transaction(
      row.id,
      row.reference,
      row.productId,
      row.customerId,
      row.deliveryId,
      row.amount,
      row.baseFee,
      row.deliveryFee,
      row.installments,
      row.status as TransactionStatus,
      row.providerPaymentId,
    );
  }
}
