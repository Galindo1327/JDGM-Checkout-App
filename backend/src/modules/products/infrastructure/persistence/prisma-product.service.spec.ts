import { Test, TestingModule } from '@nestjs/testing';
import { PrismaProductService } from './prisma-product.service';

describe('PrismaProductService', () => {
  let service: PrismaProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaProductService],
    }).compile();

    service = module.get<PrismaProductService>(PrismaProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
