import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CreateTransactionUseCase } from '../../application/create-transaction.usecase';
import type { TransactionRepository } from '../../domain/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    const result = await this.createTransactionUseCase.execute({
      productId: dto.productId,
      customer: dto.customer,
      delivery: dto.delivery,
      cardToken: dto.cardToken,
      acceptanceToken: dto.acceptanceToken,
      acceptPersonalAuth: dto.acceptPersonalAuth,
      installments: dto.installments,
    });

    return result.match(
      (transaction) => transaction,
      (error) => {
        throw new BadRequestException(error.message);
      },
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const transaction = await this.transactions.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }
    return transaction;
  }
}
