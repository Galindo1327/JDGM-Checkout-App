import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { name: 'Camiseta Oversize', description: 'Algodón 100%, talla única', price: 79900, stock: 15 },
      { name: 'Gorra Classic', description: 'Ajustable, unitalla', price: 45000, stock: 30 },
    ],
  });
  console.log('Seed completado');
}

main().finally(() => prisma.$disconnect());