import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

/**
 * Self-contained RFC 6238 TOTP (SHA-1, 6 digits, 30s step) with RFC 4648
 * base32 — no third-party dependency for the security-critical core.
 *
 * Verification is drift-tolerant (±1 step = ±30s) and constant-time.
 * AES-256-GCM helpers keep the shared secret encrypted at rest; the key is
 * derived from JWT_REFRESH_SECRET (already Joi-enforced ≥32 chars) via
 * SHA-256, so deployments gain 2FA secret encryption with zero new required env.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_DRIFT_STEPS = 1;

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  // RFC 4648: pad to a multiple of 8 characters.
  return output + '='.repeat((8 - (output.length % 8)) % 8);
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) {
      throw new Error('Invalid base32 character');
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac('sha1', secret).update(buf).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function generateTotpSecret(): string {
  // 20 bytes = 160 bits of entropy, the RFC-recommended secret size.
  return base32Encode(randomBytes(20));
}

/** Current TOTP value for a base32 secret (used by tests and dev tooling only). */
export function currentTotp(secret: string, atMs: number = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(atMs / 1000 / TOTP_STEP_SECONDS));
}

/**
 * Verify a TOTP with ±1 step drift. Returns the matched step so callers can
 * prevent replay of the same step twice (enforced by the service layer).
 */
export function verifyTotp(
  secret: string,
  token: string,
  atMs: number = Date.now(),
): { valid: boolean; step: number | null } {
  if (!/^\d{6}$/.test(token.trim())) {
    return { valid: false, step: null };
  }
  const normalized = token.trim();
  const counter = Math.floor(atMs / 1000 / TOTP_STEP_SECONDS);
  const secretBuf = base32Decode(secret);
  for (let drift = -TOTP_DRIFT_STEPS; drift <= TOTP_DRIFT_STEPS; drift += 1) {
    const step = counter + drift;
    const expected = hotp(secretBuf, step);
    const a = Buffer.from(expected);
    const b = Buffer.from(normalized);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { valid: true, step };
    }
  }
  return { valid: false, step: null };
}

function encryptionKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

const ENCRYPTION_PREFIX = 'v1:';

export function encryptTotpSecret(plaintext: string, keyMaterial: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(keyMaterial), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptTotpSecret(payload: string, keyMaterial: string): string {
  if (!payload.startsWith(ENCRYPTION_PREFIX)) {
    throw new Error('Unsupported encrypted payload');
  }
  const [ivB64, tagB64, dataB64] = payload.slice(ENCRYPTION_PREFIX.length).split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(keyMaterial), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
