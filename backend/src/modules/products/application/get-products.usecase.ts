import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { Product } from '../domain/product.entity';
import type { ProductRepository } from '../domain/product.repository';
import { PRODUCT_REPOSITORY } from '../domain/product.repository';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
  ) {}

  async execute(): Promise<Result<Product[], Error>> {
    try {
      const products = await this.repo.findAll();
      return ok(products);
    } catch (e) {
      return err(new Error('No se pudieron obtener los productos'));
    }
  }
}