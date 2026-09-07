import {
  base32Decode,
  base32Encode,
  currentTotp,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp,
} from './totp';

describe('base32 (RFC 4648)', () => {
  it('matches known RFC 4648 test vectors', () => {
    expect(base32Encode(Buffer.from(''))).toBe('');
    expect(base32Encode(Buffer.from('f'))).toBe('MY======');
    expect(base32Encode(Buffer.from('fo'))).toBe('MZXQ====');
    expect(base32Encode(Buffer.from('foo'))).toBe('MZXW6===');
    expect(base32Encode(Buffer.from('foob'))).toBe('MZXW6YQ=');
    expect(base32Encode(Buffer.from('fooba'))).toBe('MZXW6YTB');
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI======');
  });

  it('round-trips arbitrary binary (encode/decode without padding)', () => {
    const bytes = Buffer.from(Array.from({ length: 64 }, (_, i) => (i * 37 + 11) % 256));
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it('decodes lowercase and stripped separators/padding', () => {
    expect(base32Decode('mzxw6ytb')).toEqual(Buffer.from('fooba'));
    expect(base32Decode('MZ XW-6Y TB==')).toEqual(Buffer.from('fooba'));
  });
});

describe('TOTP (RFC 6238, SHA-1 / 6 digits / 30s)', () => {
  // RFC 6238 Appendix B secret for SHA-1 ("12345678901234567890" ASCII).
  const RFC_SECRET_ASCII = '12345678901234567890';
  const RFC_SECRET_B32 = base32Encode(Buffer.from(RFC_SECRET_ASCII, 'ascii'));

  const VECTORS: Array<[number, string]> = [
    [59_000, '287082'],
    [1111111109000, '081804'],
    [1111111111000, '050471'],
    [1234567890000, '005924'],
    [2000000000000, '279037'],
    [20000000000000, '353130'],
  ];

  it.each(VECTORS)('matches RFC vector at T=%dms', (timeMs, expected) => {
    expect(currentTotp(RFC_SECRET_B32, timeMs)).toBe(expected);
  });

  it('accepts the current code and ±1 step drift', () => {
    const secret = generateTotpSecret();
    const at = 1_700_000_000_000;
    expect(verifyTotp(secret, currentTotp(secret, at), at).valid).toBe(true);
    expect(verifyTotp(secret, currentTotp(secret, at - 30_000), at).valid).toBe(true);
    expect(verifyTotp(secret, currentTotp(secret, at + 30_000), at).valid).toBe(true);
  });

  it('rejects beyond drift, malformed input, and wrong codes', () => {
    const secret = generateTotpSecret();
    const at = 1_700_000_000_000;
    expect(verifyTotp(secret, currentTotp(secret, at - 90_000), at).valid).toBe(false);
    expect(verifyTotp(secret, currentTotp(secret, at + 90_000), at).valid).toBe(false);
    expect(verifyTotp(secret, 'abc123', at).valid).toBe(false);
    expect(verifyTotp(secret, '12345', at).valid).toBe(false);
    expect(verifyTotp(secret, '000000', at).valid).toBe(false);
  });

  it('returns the matched step so callers can implement replay protection', () => {
    const secret = generateTotpSecret();
    const at = 1_700_000_123_000;
    const { step } = verifyTotp(secret, currentTotp(secret, at), at);
    expect(step).toBe(Math.floor(at / 1000 / 30));
  });

  it('generates 160-bit secrets in canonical base32', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
  });
});

describe('secret encryption at rest (AES-256-GCM)', () => {
  const key = 'test-key-material-that-is-long-enough';

  it('round-trips a secret and never returns the plaintext in the payload', () => {
    const secret = generateTotpSecret();
    const payload = encryptTotpSecret(secret, key);
    expect(payload).not.toContain(secret);
    expect(decryptTotpSecret(payload, key)).toBe(secret);
  });

  it('produces a unique IV per encryption', () => {
    const secret = generateTotpSecret();
    expect(encryptTotpSecret(secret, key)).not.toBe(encryptTotpSecret(secret, key));
  });

  it('fails authentication when the key or ciphertext is tampered with', () => {
    const payload = encryptTotpSecret(generateTotpSecret(), key);
    expect(() => decryptTotpSecret(payload, 'another-key-material-long-enough!!')).toThrow();
    const parts = payload.split(':');
    parts[3] = parts[3]!.slice(0, -2) + (parts[3]!.endsWith('AA') ? 'BB' : 'AA');
    expect(() => decryptTotpSecret(parts.join(':'), key)).toThrow();
  });

  it('rejects unknown payload versions', () => {
    expect(() => decryptTotpSecret('v9:x:y:z', key)).toThrow();
  });
});
