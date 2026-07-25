import { ok, err } from 'neverthrow';
import { Product } from '../../domain/product.entity';
import { GetProductsUseCase } from '../../application/get-products.usecase';
import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  const useCase = {
    execute: jest.fn(),
  };

  let controller: ProductsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProductsController(useCase as unknown as GetProductsUseCase);
  });

  it('returns products on success', async () => {
    const products = [
      new Product('1', 'Camiseta', 'Algodón', 79900, 15),
    ];
    useCase.execute.mockResolvedValue(ok(products));

    await expect(controller.getAll()).resolves.toEqual(products);
  });

  it('throws when use case fails', async () => {
    useCase.execute.mockResolvedValue(
      err(new Error('No se pudieron obtener los productos')),
    );

    await expect(controller.getAll()).rejects.toThrow(
      'No se pudieron obtener los productos',
    );
  });
});
