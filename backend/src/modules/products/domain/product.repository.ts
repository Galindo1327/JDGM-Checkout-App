import { Product } from './product.entity';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
}

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';