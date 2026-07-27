import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CreateTransactionUseCase } from './application/create-transaction.usecase';
import { PAYMENT_GATEWAY } from './domain/payment-gateway';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { ProviderPaymentGateway } from './infrastructure/payment/provider-payment.gateway';
import { PrismaTransactionRepository } from './infrastructure/persistence/prisma-transaction.repository';

@Module({
  imports: [ProductsModule],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: ProviderPaymentGateway,
    },
  ],
})
export class TransactionsModule {}
