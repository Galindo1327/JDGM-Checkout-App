import { Product } from '../domain/product.entity';
import type { ProductRepository } from '../domain/product.repository';
import { GetProductsUseCase } from './get-products.usecase';

describe('GetProductsUseCase', () => {
  const repo: jest.Mocked<ProductRepository> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    decrementStock: jest.fn(),
  };

  let useCase: GetProductsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetProductsUseCase(repo);
  });

  it('returns products when repository succeeds', async () => {
    const products = [new Product('1', 'Gorra', 'Unitalla', 45000, 30)];
    repo.findAll.mockResolvedValue(products);

    const result = await useCase.execute();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(products);
  });

  it('returns error when repository throws', async () => {
    repo.findAll.mockRejectedValue(new Error('DB down'));

    const result = await useCase.execute();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe(
      'No se pudieron obtener los productos',
    );
  });
});
