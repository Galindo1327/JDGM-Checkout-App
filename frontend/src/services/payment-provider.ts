import axios from 'axios';

const paymentProvider = axios.create({
  baseURL: import.meta.env.VITE_PAYMENT_PROVIDER_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const publicKey = import.meta.env.VITE_PAYMENT_PROVIDER_PUBLIC_KEY as string;

export interface AcceptanceTokens {
  acceptanceToken: string;
  acceptPersonalAuth: string;
  permalinkPrivacy: string;
  permalinkPersonalData: string;
}

export interface CardTokenInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export async function getAcceptanceTokens(): Promise<AcceptanceTokens> {
  const { data } = await paymentProvider.get(`/merchants/${publicKey}`);
  const merchant = data.data;

  return {
    acceptanceToken: merchant.presigned_acceptance.acceptance_token,
    acceptPersonalAuth: merchant.presigned_personal_data_auth.acceptance_token,
    permalinkPrivacy: merchant.presigned_acceptance.permalink,
    permalinkPersonalData: merchant.presigned_personal_data_auth.permalink,
  };
}

export async function tokenizeCard(input: CardTokenInput): Promise<string> {
  const { data } = await paymentProvider.post(
    '/tokens/cards',
    {
      number: input.number.replace(/\s+/g, ''),
      cvc: input.cvc,
      exp_month: input.expMonth,
      exp_year: input.expYear,
      card_holder: input.cardHolder,
    },
    {
      headers: { Authorization: `Bearer ${publicKey}` },
    },
  );

  const token = data?.data?.id as string | undefined;
  if (!token) {
    throw new Error('No se pudo tokenizar la tarjeta');
  }

  return token;
}
