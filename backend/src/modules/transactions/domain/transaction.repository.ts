import { Transaction, TransactionStatus } from './transaction.entity';

export interface CreatePendingTransactionInput {
  reference: string;
  productId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery: {
    address: string;
    city: string;
    fee: number;
  };
  amount: number;
  baseFee: number;
  deliveryFee: number;
  installments: number;
}

export interface TransactionRepository {
  createPending(input: CreatePendingTransactionInput): Promise<Transaction>;
  updateStatus(
    id: string,
    status: TransactionStatus,
    providerPaymentId?: string,
  ): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
}

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';
