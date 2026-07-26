import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Result, err, ok } from 'neverthrow';
import type { ProductRepository } from '../../products/domain/product.repository';
import { PRODUCT_REPOSITORY } from '../../products/domain/product.repository';
import type { PaymentGateway } from '../domain/payment-gateway';
import { PAYMENT_GATEWAY } from '../domain/payment-gateway';
import { Transaction, TransactionStatus } from '../domain/transaction.entity';
import type { TransactionRepository } from '../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../domain/transaction.repository';

export const BASE_FEE = 3000;
export const DEFAULT_DELIVERY_FEE = 8000;

const FINAL_STATUSES = new Set(['APPROVED', 'DECLINED', 'VOIDED', 'ERROR']);
const POLL_ATTEMPTS = 10;
const POLL_DELAY_MS = 2000;

export interface CreateTransactionCommand {
  productId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery: {
    address: string;
    city: string;
    fee?: number;
  };
  cardToken: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  installments?: number;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(
    command: CreateTransactionCommand,
  ): Promise<Result<Transaction, Error>> {
    try {
      const product = await this.products.findById(command.productId);
      if (!product) {
        return err(new Error('Producto no encontrado'));
      }
      if (product.stock < 1) {
        return err(new Error('Producto sin stock disponible'));
      }

      const baseFee = BASE_FEE;
      const deliveryFee = command.delivery.fee ?? DEFAULT_DELIVERY_FEE;
      const amount = product.price + baseFee + deliveryFee;
      const reference = `txn_${randomUUID().replace(/-/g, '')}`;

      const installments = command.installments ?? 1;

      let transaction = await this.transactions.createPending({
        reference,
        productId: product.id,
        customer: command.customer,
        delivery: {
          address: command.delivery.address,
          city: command.delivery.city,
          fee: deliveryFee,
        },
        amount,
        baseFee,
        deliveryFee,
        installments,
      });

      let payment;
      try {
        payment = await this.paymentGateway.createTransaction({
          amountInCents: amount * 100,
          currency: 'COP',
          reference,
          customerEmail: command.customer.email,
          cardToken: command.cardToken,
          acceptanceToken: command.acceptanceToken,
          acceptPersonalAuth: command.acceptPersonalAuth,
          installments,
          customerFullName: command.customer.name,
          customerPhone: command.customer.phone,
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Error al crear pago en Wompi';
        transaction = await this.transactions.updateStatus(
          transaction.id,
          'ERROR',
        );
        return err(new Error(message));
      }

      transaction = await this.transactions.updateStatus(
        transaction.id,
        this.toStatus(payment.status),
        payment.id,
      );

      if (transaction.status === 'PENDING') {
        const finalPayment = await this.pollPayment(payment.id);
        transaction = await this.transactions.updateStatus(
          transaction.id,
          this.toStatus(finalPayment.status),
          finalPayment.id,
        );
      }

      if (transaction.status === 'APPROVED') {
        await this.products.decrementStock(product.id, 1);
      }

      return ok(transaction);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'No se pudo crear la transacción';
      return err(new Error(message));
    }
  }

  private async pollPayment(wompiId: string) {
    let last = await this.paymentGateway.getTransaction(wompiId);

    for (let i = 0; i < POLL_ATTEMPTS; i++) {
      if (FINAL_STATUSES.has(last.status)) {
        return last;
      }
      await this.delay(POLL_DELAY_MS);
      last = await this.paymentGateway.getTransaction(wompiId);
    }

    return last;
  }

  private toStatus(status: string): TransactionStatus {
    switch (status) {
      case 'APPROVED':
        return 'APPROVED';
      case 'DECLINED':
        return 'DECLINED';
      case 'VOIDED':
        return 'VOIDED';
      case 'ERROR':
        return 'ERROR';
      default:
        return 'PENDING';
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
