export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

export interface DeliveryData {
  address: string;
  city: string;
  fee?: number;
}

export interface CardData {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface Transaction {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  status: string;
  wompiId: string | null;
}

export interface CreateTransactionPayload {
  productId: string;
  customer: CustomerData;
  delivery: DeliveryData;
  cardToken: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  installments?: number;
}

export type CheckoutStep = 'product' | 'checkout' | 'summary' | 'result';
