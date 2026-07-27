import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
  it('reads string message from axios response', () => {
    const error = new AxiosError('Request failed');
    error.response = {
      data: { message: 'Sin stock' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as never },
    };
    expect(getErrorMessage(error)).toBe('Sin stock');
  });

  it('joins array messages from axios response', () => {
    const error = new AxiosError('Request failed');
    error.response = {
      data: { message: ['Campo A', 'Campo B'] },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as never },
    };
    expect(getErrorMessage(error)).toBe('Campo A, Campo B');
  });

  it('falls back to axios message when response has no message', () => {
    const error = new AxiosError('Network Error');
    expect(getErrorMessage(error)).toBe('Network Error');
  });

  it('falls back to Error message and generic text', () => {
    expect(getErrorMessage(new Error('Token inválido'))).toBe('Token inválido');
    expect(getErrorMessage('boom')).toBe('No se pudo completar el pago');
  });
});
