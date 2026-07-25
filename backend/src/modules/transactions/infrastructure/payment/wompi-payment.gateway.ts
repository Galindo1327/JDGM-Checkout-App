import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import axios, { AxiosInstance } from 'axios';
import type {
  CreatePaymentInput,
  PaymentGateway,
  PaymentResult,
} from '../../domain/payment-gateway';

@Injectable()
export class WompiPaymentGateway implements PaymentGateway {
  private readonly http: AxiosInstance;
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly integrityKey: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.getOrThrow<string>('WOMPI_SANDBOX_URL');
    this.privateKey = this.config.getOrThrow<string>('WOMPI_PRIVATE_KEY');
    this.publicKey = this.config.getOrThrow<string>('WOMPI_PUBLIC_KEY');
    this.integrityKey = this.config.getOrThrow<string>('WOMPI_INTEGRITY_KEY');

    this.http = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createTransaction(input: CreatePaymentInput): Promise<PaymentResult> {
    const signature = this.buildIntegritySignature(
      input.reference,
      input.amountInCents,
      input.currency,
    );

    try {
      const response = await this.http.post(
        '/transactions',
        {
          acceptance_token: input.acceptanceToken,
          accept_personal_auth: input.acceptPersonalAuth,
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          signature,
          customer_email: input.customerEmail,
          reference: input.reference,
          payment_method: {
            type: 'CARD',
            token: input.cardToken,
            installments: input.installments,
          },
          customer_data: {
            full_name: input.customerFullName,
            phone_number: input.customerPhone,
          },
        },
        {
          headers: { Authorization: `Bearer ${this.privateKey}` },
        },
      );

      const data = response.data?.data;
      if (!data?.id) {
        throw new Error('Respuesta inválida de Wompi al crear la transacción');
      }

      return {
        id: data.id,
        status: data.status,
        statusMessage: data.status_message,
      };
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }

  async getTransaction(id: string): Promise<PaymentResult> {
    try {
      const response = await this.http.get(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${this.publicKey}` },
      });

      const data = response.data?.data;
      if (!data?.id) {
        throw new Error(
          'Respuesta inválida de Wompi al consultar la transacción',
        );
      }

      return {
        id: data.id,
        status: data.status,
        statusMessage: data.status_message,
      };
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | { error?: { messages?: unknown; reason?: string }; message?: string }
        | undefined;
      const messages = data?.error?.messages;
      if (Array.isArray(messages)) {
        return messages.map(String).join(', ');
      }
      if (typeof messages === 'object' && messages !== null) {
        return JSON.stringify(messages);
      }
      if (data?.error?.reason) return data.error.reason;
      if (data?.message) return data.message;
      return error.message;
    }
    if (error instanceof Error) return error.message;
    return 'Error desconocido al comunicarse con Wompi';
  }

  private buildIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const raw = `${reference}${amountInCents}${currency}${this.integrityKey}`;
    return createHash('sha256').update(raw).digest('hex');
  }
}
