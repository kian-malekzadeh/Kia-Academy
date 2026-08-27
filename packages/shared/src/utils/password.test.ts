import { describe, expect, it } from 'vitest';
import {
  evaluatePasswordRequirements,
  isSecurePassword,
  passwordsMatch,
  SECURE_PASSWORD_PATTERN,
} from './password';

describe('password policy', () => {
  it('requires length, casing, digit, and special character', () => {
    expect(isSecurePassword('Short1!')).toBe(false);
    expect(isSecurePassword('longenough1!')).toBe(false);
    expect(isSecurePassword('LongEnough!')).toBe(false);
    expect(isSecurePassword('LongEnough1')).toBe(false);
    expect(isSecurePassword('LongEnough1!')).toBe(true);
    expect(SECURE_PASSWORD_PATTERN.test('KiaAcademy123!')).toBe(true);
  });

  it('exposes per-requirement checks for realtime UI', () => {
    const result = evaluatePasswordRequirements('Aa1!');
    expect(result.minLength).toBe(false);
    expect(result.uppercase).toBe(true);
    expect(result.lowercase).toBe(true);
    expect(result.number).toBe(true);
    expect(result.special).toBe(true);
  });

  it('compares confirmation passwords', () => {
    expect(passwordsMatch('Abcdef1!', 'Abcdef1!')).toBe(true);
    expect(passwordsMatch('Abcdef1!', 'Abcdef1?')).toBe(false);
    expect(passwordsMatch('', '')).toBe(false);
  });
});
