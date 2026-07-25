import { Product } from '../../domain/product.entity';
import { PrismaService } from '../../../../shared/prisma.service';
import { PrismaProductRepository } from './prisma-product.repository';

describe('PrismaProductRepository', () => {
  const prisma = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let repository: PrismaProductRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaProductRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('maps findAll rows to Product entities', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Camiseta',
        description: 'Oversize',
        price: 79900,
        stock: 10,
      },
    ]);

    const result = await repository.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      new Product('p1', 'Camiseta', 'Oversize', 79900, 10),
    );
  });

  it('returns product by id', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Camiseta',
      description: 'Oversize',
      price: 79900,
      stock: 10,
    });

    const result = await repository.findById('p1');

    expect(result).toEqual(
      new Product('p1', 'Camiseta', 'Oversize', 79900, 10),
    );
  });

  it('returns null when product does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('decrements stock', async () => {
    prisma.product.update.mockResolvedValue({});

    await repository.decrementStock('p1', 1);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { decrement: 1 } },
    });
  });
});
