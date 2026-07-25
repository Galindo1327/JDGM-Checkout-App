import { Module } from '@nestjs/common';
import { ProductsController } from './infrastructure/http/products.controller';
import { GetProductsUseCase } from './application/get-products.usecase';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { PRODUCT_REPOSITORY } from './domain/product.repository';
import { PrismaService } from '../../shared/prisma.service';

@Module({
  controllers: [ProductsController],
  providers: [
    GetProductsUseCase,
    PrismaService,
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
})
export class ProductsModule {}