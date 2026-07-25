export interface CreatePaymentInput {
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string;
  cardToken: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  installments: number;
  customerFullName: string;
  customerPhone: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  statusMessage?: string;
}

export interface PaymentGateway {
  createTransaction(input: CreatePaymentInput): Promise<PaymentResult>;
  getTransaction(id: string): Promise<PaymentResult>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
