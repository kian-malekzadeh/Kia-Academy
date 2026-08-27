import { describe, expect, it } from 'vitest';
import {
  fromDisplayUnits,
  normalizePaymentCurrency,
  toDisplayUnits,
  toGatewayRials,
} from './currency';

describe('currency helpers', () => {
  it('always sends rials to gateways', () => {
    expect(toGatewayRials(1490000)).toBe(1490000);
    expect(toGatewayRials(-1)).toBe(0);
  });

  it('converts display units for IRT', () => {
    expect(toDisplayUnits(1490000, 'irt')).toBe(149000);
    expect(fromDisplayUnits(149000, 'irt')).toBe(1490000);
    expect(toDisplayUnits(1490000, 'irr')).toBe(1490000);
  });

  it('normalizes currency codes', () => {
    expect(normalizePaymentCurrency('toman')).toBe('irt');
    expect(normalizePaymentCurrency('IRT')).toBe('irt');
    expect(normalizePaymentCurrency('usd')).toBe('irr');
  });
});
