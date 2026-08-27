import { describe, expect, it } from 'vitest';
import { containsUnsafeText, isValidEmail, normalizeIranianPhone } from './auth';

describe('auth text safety helpers', () => {
  it('detects unsafe text markers without regex backtracking', () => {
    expect(containsUnsafeText('<script>alert(1)</script>')).toBe(true);
    expect(containsUnsafeText('javascript:alert(1)')).toBe(true);
    expect(containsUnsafeText('onload = run()')).toBe(true);
    expect(containsUnsafeText('crypto    giveaway for everyone')).toBe(true);
    expect(containsUnsafeText('normal profile text')).toBe(false);
  });

  it('validates email addresses with deterministic parsing', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.domain.org')).toBe(true);
    expect(isValidEmail('bad@@example.com')).toBe(false);
    expect(isValidEmail('no-at-symbol')).toBe(false);
    expect(isValidEmail('user@localhost')).toBe(false);
  });

  it('normalizes iranian mobile numbers', () => {
    expect(normalizeIranianPhone('09123456789')).toBe('09123456789');
    expect(normalizeIranianPhone('+989123456789')).toBe('09123456789');
    expect(normalizeIranianPhone('9123456789')).toBe('09123456789');
    expect(normalizeIranianPhone('001122')).toBeNull();
  });
});
