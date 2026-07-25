import { Controller, Get } from '@nestjs/common';
import { GetProductsUseCase } from '../../application/get-products.usecase';

@Controller('products')
export class ProductsController {
  constructor(private readonly getProductsUseCase: GetProductsUseCase) {}

  @Get()
  async getAll() {
    const result = await this.getProductsUseCase.execute();
    return result.match(
      (products) => products,
      (error) => { throw new Error(error.message); },
    );
  }
}