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

export function getAvailabilityTag(stock: number) {
  if (stock < 1) {
    return { label: 'Agotado', color: 'error' as const };
  }
  if (stock < 10) {
    return { label: 'Casi Agotado', color: 'warning' as const };
  }
  return { label: 'Disponible', color: 'success' as const };
}

export const BASE_FEE = 3000;

export function calculateCheckoutTotal(
  productPrice: number,
  deliveryFee = 8000,
  baseFee = BASE_FEE,
): number {
  return productPrice + baseFee + deliveryFee;
}

export function getPaymentStatusMeta(status: string) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Pago aprobado',
        color: '#1f5a34',
        tone: 'approved' as const,
      };
    case 'DECLINED':
      return {
        label: 'Pago declinado',
        color: '#b42318',
        tone: 'declined' as const,
      };
    default:
      return {
        label: status === 'ERROR' ? 'Error en el pago' : `Estado: ${status}`,
        color: '#b54708',
        tone: 'other' as const,
      };
  }
}
