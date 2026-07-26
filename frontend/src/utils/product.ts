import camisaOversize from '../assets/camisa_oversize.jpg';
import gorraClasica from '../assets/gorra_clasica.jpg';

const productImages: Record<string, string> = {
  'camiseta oversize': camisaOversize,
  'gorra classic': gorraClasica,
  'gorra clasica': gorraClasica,
};

export function getProductImage(name: string): string | undefined {
  return productImages[name.trim().toLowerCase()];
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
