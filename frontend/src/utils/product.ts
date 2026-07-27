import camisaOversize from '../assets/Products/camisa_oversize.jpg';
import gorraClasica from '../assets/Products/gorra_clasica.jpg';
import pantalonesJean from '../assets/Products/pantalones-jean.jpg';
import relojLujo from '../assets/Products/relojlujo.jpg';
import zapatillas from '../assets/Products/zapatillas.jpg';

const productImages: Record<string, string> = {
  'camiseta oversize': camisaOversize,
  'camisa oversize': camisaOversize,
  'gorra classic': gorraClasica,
  'gorra clasica': gorraClasica,
  'pantalones jean': pantalonesJean,
  'reloj de lujo': relojLujo,
  'par de zapatillas': zapatillas,
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
