export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR'
  | 'VOIDED';

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly reference: string,
    public readonly productId: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    public readonly amount: number,
    public readonly baseFee: number,
    public readonly deliveryFee: number,
    public readonly installments: number,
    public readonly status: TransactionStatus,
    public readonly providerPaymentId: string | null,
  ) {}
}
