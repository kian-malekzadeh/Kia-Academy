import type { PaymentCurrencyCode } from '../types/site-settings';

export type { PaymentCurrencyCode };

export const PAYMENT_CURRENCY_CODES = ['irr', 'irt'] as const;

/**
 * Amount to send to Iranian PSPs (ZarinPal, IDPay, …).
 * Those gateways expect Rials regardless of the site display currency.
 */
export function toGatewayRials(amountIrr: number): number {
  return Math.max(0, Math.round(Number(amountIrr) || 0));
}

/** Convert stored IRR to the configured display unit. */
export function toDisplayUnits(amountIrr: number, currency: PaymentCurrencyCode): number {
  const n = Math.round(Number(amountIrr) || 0);
  return currency === 'irt' ? Math.round(n / 10) : n;
}

/** Convert an admin-entered display amount back to stored IRR. */
export function fromDisplayUnits(displayAmount: number, currency: PaymentCurrencyCode): number {
  const n = Math.round(Number(displayAmount) || 0);
  return currency === 'irt' ? n * 10 : n;
}

export function normalizePaymentCurrency(raw: unknown): PaymentCurrencyCode {
  const v = String(raw ?? 'irr').toLowerCase();
  return v === 'irt' || v === 'toman' ? 'irt' : 'irr';
}
