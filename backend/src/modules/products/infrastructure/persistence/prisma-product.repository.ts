import { Injectable } from '@nestjs/common';
import type { ProductRepository } from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';
import { PrismaService } from '../../../../shared/prisma.service';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany();
    return rows.map(
      (r) => new Product(r.id, r.name, r.description, r.price, r.stock),
    );
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    if (!row) return null;
    return new Product(row.id, row.name, row.description, row.price, row.stock);
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
  }
}
