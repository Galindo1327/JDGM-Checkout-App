import { Module } from '@nestjs/common';
import { ProductsController } from './infrastructure/http/products.controller';
import { GetProductsUseCase } from './application/get-products.usecase';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { PRODUCT_REPOSITORY } from './domain/product.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    GetProductsUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
