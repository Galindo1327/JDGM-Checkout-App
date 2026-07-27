import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    name: 'Camiseta Oversize',
    description:
      'Camiseta de corte oversize con acabado stone-wash. Hombros caídos y silueta urbana relajada.',
    price: 79900,
    stock: 15,
  },
  {
    name: 'Gorra Classic',
    description:
      'Gorra clásica de béisbol en tono chocolate. Visera curva, ajuste cómodo y acabado premium.',
    price: 45000,
    stock: 30,
  },
  {
    name: 'Pantalones Jean',
    description:
      'Jean indigo de corte slim con costuras contrastantes. Cómodo, resistente y versátil para el día a día.',
    price: 90000,
    stock: 15,
  },
  {
    name: 'Reloj de Lujo',
    description:
      'Reloj análogo dorado con bisel brillante y brazalete metálico. Detalle elegante para ocasiones especiales.',
    price: 1200000,
    stock: 8,
  },
  {
    name: 'Par de Zapatillas',
    description:
      'Zapatillas urbanas en cuero negro con suela blanca. Diseño low-top cómodo para uso diario.',
    price: 110000,
    stock: 15,
  },
];

async function main() {
  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: product.description,
          price: product.price,
          stock: product.stock,
        },
      });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  console.log('Seed completado');
}

main().finally(() => prisma.$disconnect());
